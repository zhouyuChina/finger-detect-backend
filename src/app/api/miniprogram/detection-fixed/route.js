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
      username,
      archiveName, 
      detectionType = 'left_hand_thumb',
      imageUrl
    } = body

    // 验证必填字段
    if (!username || !archiveName || !imageUrl) {
      return createErrorResponse('用户名、档案名称和图片URL为必填项', 400)
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

    console.log('✅ 找到子用户:', subUser.realName)

    // 2. 调用第三方检测服务
    console.log('🔄 开始调用第三方检测服务...')
    const thirdPartyResult = await mockThirdPartyDetection(imageUrl, detectionType)
    
    if (!thirdPartyResult.success) {
      return createErrorResponse('第三方检测服务调用失败', 500)
    }

    console.log('✅ 第三方检测服务调用成功')

    // 3. 检查档案是否已存在
    const existingArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: subUser.id,
          archiveName: archiveName
        }
      }
    })

    // 4. 检查是否已有检测记录
    const existingDetections = await prisma.detection.findMany({
      where: {
        subUserId: subUser.id,
        archiveName: archiveName,
        status: 'completed'
      },
      select: {
        id: true,
        result: true,
        confidence: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    let isNewArchive = false
    let archive

    if (existingArchive) {
      // 档案已存在，检查是否已有报告
      if (existingDetections.length > 0) {
        // 已有报告，这是治疗过程中的拍照，不生成新报告
        console.log('📸 档案已存在且有报告，这是治疗过程中的拍照')
        
        // 只更新档案的照片数量，不创建新的检测记录
        archive = await prisma.archive.update({
          where: {
            subUserId_archiveName: {
              subUserId: subUser.id,
              archiveName: archiveName
            }
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

        // 更新子用户的拍照数量
        await prisma.subUser.update({
          where: { id: subUser.id },
          data: {
            photos: {
              increment: 1
            }
          }
        })

        // 构建响应数据（不包含检测结果）
        const responseData = {
          archive: {
            id: archive.id,
            archiveName: archive.archiveName,
            photoCount: archive.photoCount,
            detectionTime: archive.detectionTime,
            updatedAt: archive.updatedAt
          },
          message: '治疗过程拍照完成，照片已保存',
          isTreatmentPhoto: true
        }

        return createSuccessResponse(responseData, '治疗过程拍照完成')
      } else {
        // 档案存在但没有检测记录，创建第一份报告
        console.log('📋 档案存在但无报告，创建第一份报告')
        isNewArchive = false
      }
    } else {
      // 新档案，创建第一份报告
      console.log('🆕 新档案，创建第一份报告')
      isNewArchive = true
    }

    // 5. 创建或更新档案记录（只有新档案或需要创建报告时才执行）
    if (isNewArchive) {
      archive = await prisma.archive.create({
        data: {
          subUserId: subUser.id,
          archiveName,
          bodyPart: detectionType,
          activity: 'high',
          photoCount: 1,
          detectionTime: new Date()
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
      console.log('✅ 新档案创建成功')
    } else {
      // 更新现有档案
      archive = await prisma.archive.update({
        where: {
          subUserId_archiveName: {
            subUserId: subUser.id,
            archiveName: archiveName
          }
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
      console.log('✅ 档案更新成功')
    }

    // 6. 创建检测记录（第一份报告）
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName: archiveName,
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

    // 7. 更新子用户的检测数量和拍照数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: 1  // 只有创建报告时才增加
        },
        photos: {
          increment: 1
        },
        archives: {
          increment: isNewArchive ? 1 : 0  // 只有新档案才增加计数
        }
      }
    })

    console.log('✅ 子用户检测数量已更新')

    // 8. 构建响应数据（第一份报告）
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
      isFirstReport: true
    }

    return createSuccessResponse(responseData, '检测完成，报告已生成')

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