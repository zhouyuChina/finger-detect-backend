import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取检测记录列表
async function getDetections(request) {
  let prisma = null
  try {
    console.log('🔍 获取检测记录列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    
    // 验证参数
    if (!username) {
      return createErrorResponse('请提供用户名参数', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 首先根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: request.user.id,
        username: username,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在，微信用户ID:', request.user.id, '用户名:', username)
      return createErrorResponse('用户不存在或无权限访问', 404)
    }

    console.log('✅ 找到子用户:', subUser.realName)

    // 2. 计算分页参数
    const skip = (page - 1) * limit

    // 3. 查询该子用户的检测记录
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where: {
          subUserId: subUser.id
        },
        select: {
          id: true,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.detection.count({
        where: {
          subUserId: subUser.id
        }
      })
    ])

    console.log('✅ 获取检测记录成功，数量:', detections.length)

    // 4. 构建响应数据
    const responseData = {
      subUser: {
        id: subUser.id,
        username: subUser.username,
        realName: subUser.realName
      },
      detections: detections.map(detection => ({
        id: detection.id,
        archiveName: detection.archiveName,
        detectionType: detection.detectionType,
        imageUrl: detection.imageUrl,
        result: detection.result,
        confidence: detection.confidence,
        status: detection.status,
        errorMsg: detection.errorMsg,
        remark: detection.remark,
        detectionTime: detection.detectionTime,
        createdAt: detection.createdAt,
        updatedAt: detection.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return createSuccessResponse(responseData, '获取检测记录成功')

  } catch (error) {
    console.error('❌ 获取检测记录错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取检测记录失败')
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

// Mock 第三方检测服务
async function mockThirdPartyDetection(imageUrl, detectionType) {
  console.log('🤖 调用第三方检测服务 (Mock)')
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 根据检测类型生成不同的结果
  const results = {
    fingerprint: {
      normal: {
        description: '指纹检测结果正常，指纹纹路清晰，无异常特征。',
        suggestion: '建议保持良好的手部卫生，定期清洁指纹采集设备。'
      },
      abnormal: {
        description: '检测到指纹异常，可能存在磨损、疤痕或其他特征变化。',
        suggestion: '建议重新采集指纹，或咨询专业医生进行进一步检查。'
      }
    },
    face: {
      normal: {
        description: '面部检测结果正常，面部特征完整，无异常发现。',
        suggestion: '建议保持良好的面部护理习惯，避免过度暴露在阳光下。'
      },
      abnormal: {
        description: '检测到面部异常，可能存在皮肤问题或其他特征变化。',
        suggestion: '建议咨询皮肤科医生，进行专业的面部护理指导。'
      }
    },
    iris: {
      normal: {
        description: '虹膜检测结果正常，虹膜结构完整，无异常特征。',
        suggestion: '建议定期进行眼科检查，保持良好的用眼习惯。'
      },
      abnormal: {
        description: '检测到虹膜异常，可能存在眼部疾病或其他问题。',
        suggestion: '建议立即咨询眼科医生，进行专业的眼部检查。'
      }
    },
    voice: {
      normal: {
        description: '语音检测结果正常，声纹特征稳定，无异常变化。',
        suggestion: '建议保持良好的嗓音习惯，避免过度用嗓。'
      },
      abnormal: {
        description: '检测到语音异常，可能存在嗓音问题或其他变化。',
        suggestion: '建议咨询耳鼻喉科医生，进行专业的嗓音检查。'
      }
    }
  }
  
  // 随机生成结果（70% 正常，30% 异常）
  const isNormal = Math.random() > 0.3
  const resultType = isNormal ? 'normal' : 'abnormal'
  const result = results[detectionType]?.[resultType] || results.fingerprint.normal
  
  // 生成置信度（正常结果置信度较高）
  const confidence = isNormal ? 0.85 + Math.random() * 0.1 : 0.6 + Math.random() * 0.2
  
  return {
    success: true,
    data: {
      imageUrl: imageUrl,
      description: result.description,
      suggestion: result.suggestion,
      result: resultType,
      confidence: parseFloat(confidence.toFixed(2)),
      detectionType: detectionType,
      timestamp: new Date().toISOString()
    }
  }
}

// 创建检测记录
async function createDetection(request) {
  let prisma = null
  try {
    console.log('➕ 创建检测记录接口被调用')
    
    const body = await request.json()
    const { 
      username,
      archiveName, 
      detectionType = 'fingerprint',
      imageUrl
    } = body

    // 验证必填字段
    if (!username || !archiveName || !imageUrl) {
      return createErrorResponse('用户名、档案名称和图片URL为必填项', 400)
    }

    // 验证检测类型
    const validTypes = ['fingerprint', 'face', 'iris', 'voice']
    if (!validTypes.includes(detectionType)) {
      return createErrorResponse('检测类型无效', 400)
    }

    // 验证图片URL格式
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/uploads/')) {
      return createErrorResponse('图片URL格式不正确', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: request.user.id,
        username: username,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在，微信用户ID:', request.user.id, '用户名:', username)
      return createErrorResponse('用户不存在或无权限操作', 404)
    }

    // 2. 调用第三方检测服务（Mock）
    console.log('🔄 开始调用第三方检测服务...')
    const thirdPartyResult = await mockThirdPartyDetection(imageUrl, detectionType)
    
    if (!thirdPartyResult.success) {
      return createErrorResponse('第三方检测服务调用失败', 500)
    }

    console.log('✅ 第三方检测服务调用成功')

    // 3. 创建检测记录
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName,
        detectionType,
        imageUrl,
        result: thirdPartyResult.data.result,
        confidence: thirdPartyResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${detectionType}, 置信度: ${thirdPartyResult.data.confidence}`
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

    // 4. 更新子用户的检测数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: 1
        }
      }
    })

    console.log('✅ 检测记录创建成功:', newDetection.archiveName)

    // 5. 构建响应数据
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
      }
    }

    return createSuccessResponse(responseData, '检测完成')

  } catch (error) {
    console.error('❌ 创建检测记录错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('创建检测记录失败')
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
export const GET = miniprogramAuthMiddleware(getDetections)
export const POST = miniprogramAuthMiddleware(createDetection) 