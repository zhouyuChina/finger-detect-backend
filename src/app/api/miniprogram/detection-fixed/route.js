import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// Mock 第三方检测服务
async function mockThirdPartyDetection(imageUrl, detectionType) {
  console.log('🤖 调用第三方检测服务 (Mock)')
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 随机生成结果
  const isNormal = Math.random() > 0.3
  const resultType = isNormal ? 'normal' : 'abnormal'
  const confidence = isNormal ? 0.85 + Math.random() * 0.1 : 0.6 + Math.random() * 0.2
  
  return {
    success: true,
    data: {
      imageUrl: imageUrl,
      description: `${detectionType} 检测结果${isNormal ? '正常' : '异常'}`,
      suggestion: isNormal ? '建议继续保持良好的卫生习惯' : '建议及时就医',
      result: resultType,
      confidence: parseFloat(confidence.toFixed(2)),
      detectionType: detectionType,
      timestamp: new Date().toISOString()
    }
  }
}

// 创建检测记录（修复版本）
async function createDetectionFixed(request) {
  let prisma = null
  try {
    console.log('➕ 创建检测记录接口被调用（修复版本）')
    
    const body = await request.json()
    const { 
      subUserId,
      archiveId, 
      detectionType = 'left_hand_thumb',
      imageUrl
    } = body

    // 验证必填字段
    if (!subUserId || !archiveId || !imageUrl) {
      return createErrorResponse('子用户ID、档案ID和图片URL为必填项', 400)
    }

    // 验证检测类型
    const validTypes = [
      'left_hand_thumb', 'left_hand_index', 'left_hand_middle', 'left_hand_ring', 'left_hand_little',
      'right_hand_thumb', 'right_hand_index', 'right_hand_middle', 'right_hand_ring', 'right_hand_little',
      'left_foot_big', 'left_foot_second', 'left_foot_third', 'left_foot_fourth', 'left_foot_little',
      'right_foot_big', 'right_foot_second', 'right_foot_third', 'right_foot_fourth', 'right_foot_little'
    ]
    if (!validTypes.includes(detectionType)) {
      return createErrorResponse('检测类型无效', 400)
    }

    // 验证图片URL格式
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/uploads/')) {
      return createErrorResponse('图片URL格式不正确', 400)
    }

    console.log('✅ 参数验证通过')

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 验证子用户是否属于当前微信用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        id: subUserId,
        wechatUserId: request.user.id,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在或无权限，微信用户ID:', request.user.id, '子用户ID:', subUserId)
      return createErrorResponse('用户不存在或无权限操作', 404)
    }

    console.log('✅ 验证子用户权限成功:', subUser.realName)

    // 2. 调用第三方检测服务
    console.log('🔄 开始调用第三方检测服务...')
    const thirdPartyResult = await mockThirdPartyDetection(imageUrl, detectionType)
    
    if (!thirdPartyResult.success) {
      return createErrorResponse('第三方检测服务调用失败', 500)
    }

    console.log('✅ 第三方检测服务调用成功')

    // 3. 检查档案是否已存在
    const existingArchive = await prisma.archive.findFirst({
      where: {
        id: archiveId,
        subUserId: subUser.id
      }
    })

    if (!existingArchive) {
      console.log('❌ 档案不存在或无权限访问:', archiveId)
      return createErrorResponse('档案不存在或无权限访问', 404)
    }

    console.log('✅ 找到档案:', existingArchive.archiveName)

    // 4. 检查是否已有检测记录
    const existingDetections = await prisma.detection.findMany({
      where: {
        subUserId: subUser.id,
        archiveName: existingArchive.archiveName
        // 移除 status: 'completed' 条件，检查是否有任何检测记录
      },
      select: {
        id: true,
        result: true,
        confidence: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📋 找到 ${existingDetections.length} 条检测记录`)

    let archive
    let isFirstReport = existingDetections.length === 0

    // 每次拍照都创建检测记录，但只有第一次才生成报告
    if (isFirstReport) {
      console.log('📋 第一次检测，创建第一份报告')
    } else {
      console.log('📸 后续检测，创建治疗过程记录')
    }

    // 5. 创建检测记录（每次拍照都创建）
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName: existingArchive.archiveName, // 使用找到的档案名称
        detectionType,
        imageUrl,
        result: thirdPartyResult.data.result,
        confidence: thirdPartyResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${detectionType}, 置信度: ${thirdPartyResult.data.confidence}`,
        detectionTime: new Date()
      },
      select: {
        id: true,
        subUserId: true,
        archiveName: true,
        detectionType: true,
        imageUrl: true,
        result: true,
        confidence: true,
        status: true,
        errorMsg: true,
        remark: true,
        detectionTime: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ 检测记录创建成功:', newDetection.id)

    // 6. 更新档案信息
    archive = await prisma.archive.update({
      where: {
        id: archiveId
      },
      data: {
        photoCount: {
          increment: 1
        },
        detectionTime: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        subUserId: true,
        archiveName: true,
        bodyPart: true,
        activity: true,
        photoCount: true,
        detectionTime: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ 档案照片数量已更新:', archive.photoCount)

    // 7. 更新子用户的检测数量和拍照数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: isFirstReport ? 1 : 0  // 只有第一次才增加报告数
        },
        photos: {
          increment: 1  // 每次拍照都增加照片数
        },
        archives: {
          increment: 0  // 档案已存在，不增加计数
        }
      }
    })

    console.log('✅ 子用户数据已更新')

    // 8. 构建响应数据
    const responseData = {
      detection: {
        id: newDetection.id,
        archiveName: newDetection.archiveName,
        detectionType: newDetection.detectionType,
        imageUrl: newDetection.imageUrl,
        result: newDetection.result,
        confidence: newDetection.confidence,
        status: newDetection.status,
        remark: newDetection.remark,
        detectionTime: newDetection.detectionTime,
        createdAt: newDetection.createdAt
      },
      thirdPartyResult: {
        imageUrl: thirdPartyResult.data.imageUrl,
        description: thirdPartyResult.data.description,
        suggestion: thirdPartyResult.data.suggestion,
        result: thirdPartyResult.data.result,
        confidence: thirdPartyResult.data.confidence,
        detectionType: thirdPartyResult.data.detectionType,
        timestamp: thirdPartyResult.data.timestamp
      },
      archive: {
        id: archive.id,
        archiveName: archive.archiveName,
        photoCount: archive.photoCount,
        detectionTime: archive.detectionTime,
        createdAt: archive.createdAt
      },
      isFirstReport: isFirstReport,
      message: isFirstReport ? '检测完成，报告已生成' : '治疗过程记录已保存'
    }

    return createSuccessResponse(responseData, isFirstReport ? '检测完成，报告已生成' : '治疗过程记录已保存')

  } catch (error) {
    console.error('❌ 创建检测记录错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('创建检测记录失败: ' + error.message)
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 使用微信小程序认证中间件
export const POST = miniprogramAuthMiddleware(createDetectionFixed) 