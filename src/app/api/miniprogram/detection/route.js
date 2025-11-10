import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取检测记录列表
async function getDetections(request) {
  let prisma = null
  try {
    console.log('🔍 获取检测记录列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    
    const { searchParams } = new URL(request.url)
    const subUserId = searchParams.get('subUserId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    
    // 验证参数
    if (!subUserId) {
      return createErrorResponse('请提供子用户ID参数', 400)
    }

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
      return createErrorResponse('用户不存在或无权限访问', 404)
    }

    console.log('✅ 验证子用户权限成功:', subUser.realName)

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
  
  // 根据检测类型生成不同的灰指甲检测结果
  const results = {
    left_hand_thumb: {
      normal: {
        description: '左手拇指指甲检测结果正常，指甲表面光滑，颜色均匀，无灰指甲症状。',
        suggestion: '建议继续保持良好的手部卫生习惯，定期修剪指甲，避免指甲损伤。'
      },
      abnormal: {
        description: '检测到左手拇指可能存在灰指甲症状，指甲颜色异常，表面粗糙。',
        suggestion: '建议及时咨询皮肤科医生，进行专业治疗，避免症状扩散。'
      }
    },
    left_hand_index: {
      normal: {
        description: '左手食指指甲检测结果正常，指甲结构完整，无异常变化。',
        suggestion: '建议保持手部干燥，避免长时间浸泡在水中，预防真菌感染。'
      },
      abnormal: {
        description: '检测到左手食指可能存在灰指甲，指甲增厚，颜色发黄。',
        suggestion: '建议使用抗真菌药物，保持指甲清洁干燥，避免传染。'
      }
    },
    left_hand_middle: {
      normal: {
        description: '左手中指指甲检测结果正常，指甲健康，无灰指甲迹象。',
        suggestion: '建议定期检查指甲健康状态，保持良好的个人卫生习惯。'
      },
      abnormal: {
        description: '检测到左手中指可能存在灰指甲症状，指甲变形，质地改变。',
        suggestion: '建议及时就医治疗，避免症状加重，注意个人用品隔离。'
      }
    },
    left_hand_ring: {
      normal: {
        description: '左手无名指指甲检测结果正常，指甲状态良好，无异常。',
        suggestion: '建议避免使用刺激性化学品，保护指甲健康。'
      },
      abnormal: {
        description: '检测到左手无名指可能存在灰指甲，指甲分层，边缘不规则。',
        suggestion: '建议使用专业抗真菌治疗，避免指甲外伤，保持清洁。'
      }
    },
    left_hand_little: {
      normal: {
        description: '左手小指指甲检测结果正常，指甲完整，无灰指甲症状。',
        suggestion: '建议保持手部通风，避免潮湿环境，预防真菌滋生。'
      },
      abnormal: {
        description: '检测到左手小指可能存在灰指甲，指甲变脆，易断裂。',
        suggestion: '建议加强营养补充，使用专业治疗药物，避免指甲损伤。'
      }
    },
    right_hand_thumb: {
      normal: {
        description: '右手拇指指甲检测结果正常，指甲健康，无灰指甲迹象。',
        suggestion: '建议保持手部清洁，避免接触感染源，定期检查指甲状态。'
      },
      abnormal: {
        description: '检测到右手拇指可能存在灰指甲症状，指甲颜色异常，质地改变。',
        suggestion: '建议及时就医诊断，使用专业治疗方案，避免症状扩散。'
      }
    },
    right_hand_index: {
      normal: {
        description: '右手食指指甲检测结果正常，指甲表面光滑，无异常。',
        suggestion: '建议避免指甲外伤，保持手部干燥，预防真菌感染。'
      },
      abnormal: {
        description: '检测到右手食指可能存在灰指甲，指甲增厚，颜色发黄。',
        suggestion: '建议使用抗真菌药物，保持指甲清洁，避免传染他人。'
      }
    },
    right_hand_middle: {
      normal: {
        description: '右手中指指甲检测结果正常，指甲结构完整，健康状态良好。',
        suggestion: '建议定期修剪指甲，保持手部卫生，预防感染。'
      },
      abnormal: {
        description: '检测到右手中指可能存在灰指甲症状，指甲变形，边缘不规则。',
        suggestion: '建议及时治疗，避免症状加重，注意个人卫生。'
      }
    },
    right_hand_ring: {
      normal: {
        description: '右手无名指指甲检测结果正常，指甲健康，无灰指甲症状。',
        suggestion: '建议避免使用刺激性化学品，保护指甲健康。'
      },
      abnormal: {
        description: '检测到右手无名指可能存在灰指甲，指甲分层，质地改变。',
        suggestion: '建议使用专业抗真菌治疗，保持指甲清洁干燥。'
      }
    },
    right_hand_little: {
      normal: {
        description: '右手小指指甲检测结果正常，指甲完整，无异常变化。',
        suggestion: '建议保持手部通风，避免潮湿环境，预防真菌感染。'
      },
      abnormal: {
        description: '检测到右手小指可能存在灰指甲，指甲变脆，易断裂。',
        suggestion: '建议加强营养补充，使用专业治疗药物，避免指甲损伤。'
      }
    },
    left_foot_big: {
      normal: {
        description: '左脚大脚趾指甲检测结果正常，指甲健康，无灰指甲症状。',
        suggestion: '建议保持脚部清洁干燥，选择透气性好的鞋袜，预防真菌感染。'
      },
      abnormal: {
        description: '检测到左脚大脚趾可能存在灰指甲，指甲增厚，颜色异常。',
        suggestion: '建议及时就医治疗，保持脚部干燥，避免症状扩散。'
      }
    },
    left_foot_second: {
      normal: {
        description: '左脚第二趾指甲检测结果正常，指甲状态良好，无异常。',
        suggestion: '建议定期修剪脚趾甲，保持脚部卫生，预防感染。'
      },
      abnormal: {
        description: '检测到左脚第二趾可能存在灰指甲症状，指甲变形，质地改变。',
        suggestion: '建议使用抗真菌药物，保持脚部清洁，避免传染。'
      }
    },
    left_foot_third: {
      normal: {
        description: '左脚第三趾指甲检测结果正常，指甲完整，无灰指甲迹象。',
        suggestion: '建议避免脚部潮湿，选择合适鞋袜，预防真菌滋生。'
      },
      abnormal: {
        description: '检测到左脚第三趾可能存在灰指甲，指甲分层，边缘不规则。',
        suggestion: '建议及时治疗，避免症状加重，注意个人用品隔离。'
      }
    },
    left_foot_fourth: {
      normal: {
        description: '左脚第四趾指甲检测结果正常，指甲健康，无异常变化。',
        suggestion: '建议保持脚部通风，避免长时间穿密闭鞋袜。'
      },
      abnormal: {
        description: '检测到左脚第四趾可能存在灰指甲，指甲变脆，易断裂。',
        suggestion: '建议加强营养补充，使用专业治疗药物，保持脚部清洁。'
      }
    },
    left_foot_little: {
      normal: {
        description: '左脚小脚趾指甲检测结果正常，指甲完整，无灰指甲症状。',
        suggestion: '建议定期检查脚趾甲健康状态，保持良好的个人卫生。'
      },
      abnormal: {
        description: '检测到左脚小脚趾可能存在灰指甲，指甲颜色异常，质地改变。',
        suggestion: '建议及时就医诊断，使用专业治疗方案，避免症状扩散。'
      }
    },
    right_foot_big: {
      normal: {
        description: '右脚大脚趾指甲检测结果正常，指甲健康，无灰指甲迹象。',
        suggestion: '建议保持脚部清洁干燥，选择透气性好的鞋袜，预防真菌感染。'
      },
      abnormal: {
        description: '检测到右脚大脚趾可能存在灰指甲，指甲增厚，颜色发黄。',
        suggestion: '建议及时就医治疗，保持脚部干燥，避免症状扩散。'
      }
    },
    right_foot_second: {
      normal: {
        description: '右脚第二趾指甲检测结果正常，指甲状态良好，无异常。',
        suggestion: '建议定期修剪脚趾甲，保持脚部卫生，预防感染。'
      },
      abnormal: {
        description: '检测到右脚第二趾可能存在灰指甲症状，指甲变形，质地改变。',
        suggestion: '建议使用抗真菌药物，保持脚部清洁，避免传染。'
      }
    },
    right_foot_third: {
      normal: {
        description: '右脚第三趾指甲检测结果正常，指甲完整，无灰指甲迹象。',
        suggestion: '建议避免脚部潮湿，选择合适鞋袜，预防真菌滋生。'
      },
      abnormal: {
        description: '检测到右脚第三趾可能存在灰指甲，指甲分层，边缘不规则。',
        suggestion: '建议及时治疗，避免症状加重，注意个人用品隔离。'
      }
    },
    right_foot_fourth: {
      normal: {
        description: '右脚第四趾指甲检测结果正常，指甲健康，无异常变化。',
        suggestion: '建议保持脚部通风，避免长时间穿密闭鞋袜。'
      },
      abnormal: {
        description: '检测到右脚第四趾可能存在灰指甲，指甲变脆，易断裂。',
        suggestion: '建议加强营养补充，使用专业治疗药物，保持脚部清洁。'
      }
    },
    right_foot_little: {
      normal: {
        description: '右脚小脚趾指甲检测结果正常，指甲完整，无灰指甲症状。',
        suggestion: '建议定期检查脚趾甲健康状态，保持良好的个人卫生。'
      },
      abnormal: {
        description: '检测到右脚小脚趾可能存在灰指甲，指甲颜色异常，质地改变。',
        suggestion: '建议及时就医诊断，使用专业治疗方案，避免症状扩散。'
      }
    }
  }
  
  // 随机生成结果（70% 正常，30% 异常）
  const isNormal = Math.random() > 0.3
  const resultType = isNormal ? 'normal' : 'abnormal'
  const result = results[detectionType]?.[resultType] || results.left_hand_thumb.normal
  
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

    // 2. 调用第三方检测服务（Mock）
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

    // 4. 检查是否已有检测记录（使用 archiveId）
    const existingDetections = await prisma.detection.findMany({
      where: {
        archiveId: archiveId,
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

    let archive

    if (existingDetections.length > 0) {
      // 已有报告，这是治疗过程中的拍照，不生成新报告
      console.log('📸 档案已存在且有报告，这是治疗过程中的拍照')
      
      // 只更新档案的照片数量，不创建新的检测记录（使用 archiveId）
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
      archive = existingArchive
    }

    // 5. 创建检测记录（第一份报告，使用 archiveId）
    const newDetection = await prisma.detection.create({
      data: {
        archiveId: archiveId,
        archiveName: archive.archiveName, // 兼容旧 schema
        subUserId: subUser.id,
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

    // 6. 更新子用户的检测数量和档案数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: 1  // 只有创建报告时才增加
        },
        archives: {
          increment: 0  // 档案已存在，不增加计数
        }
      }
    })

    console.log('✅ 检测记录创建成功:', newDetection.archiveName)

    // 6. 构建响应数据（第一份报告）
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
