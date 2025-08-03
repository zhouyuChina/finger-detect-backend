const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

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
    right_foot_big: {
      normal: {
        description: '右脚大脚趾指甲检测结果正常，指甲健康，无灰指甲迹象。',
        suggestion: '建议保持脚部清洁干燥，选择透气性好的鞋袜，预防真菌感染。'
      },
      abnormal: {
        description: '检测到右脚大脚趾可能存在灰指甲，指甲增厚，颜色发黄。',
        suggestion: '建议及时就医治疗，保持脚部干燥，避免症状扩散。'
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

async function testDetectionApi() {
  try {
    console.log('🧪 开始测试检测接口...')

    // 1. 获取第一个微信用户和子用户作为测试数据
    const testWechatUser = await prisma.wechatUser.findFirst({
      include: {
        subUsers: true
      }
    })

    if (!testWechatUser || testWechatUser.subUsers.length === 0) {
      console.log('❌ 没有找到测试用的微信用户或子用户')
      return
    }

    const testSubUser = testWechatUser.subUsers[0]
    console.log(`📋 使用测试微信用户: ${testWechatUser.nickname} (${testWechatUser.openid})`)
    console.log(`📋 使用测试子用户: ${testSubUser.realName} (${testSubUser.username})`)

    // 2. 模拟 GET 请求 - 获取检测记录列表
    console.log('\n1. 测试获取检测记录列表 (GET /api/miniprogram/detection?username=xxx):')
    
    // 模拟认证中间件的行为
    const mockRequest = {
      user: {
        id: testWechatUser.id,
        openid: testWechatUser.openid,
        nickname: testWechatUser.nickname
      }
    }

    // 模拟查询参数
    const username = testSubUser.username
    const page = 1
    const limit = 10

    // 1. 首先根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: mockRequest.user.id,
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
      console.log('❌ 子用户不存在')
      return
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
    console.log('📊 检测记录统计:')
    detections.forEach((detection, index) => {
      console.log(`  ${index + 1}. ${detection.archiveName}`)
      console.log(`     检测类型: ${detection.detectionType}`)
      console.log(`     结果: ${detection.result}`)
      console.log(`     置信度: ${detection.confidence}`)
      console.log(`     状态: ${detection.status}`)
      console.log(`     创建时间: ${detection.createdAt}`)
    })

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

    console.log('📋 响应数据:')
    console.log(`- 子用户: ${responseData.subUser.realName}`)
    console.log(`- 检测记录数量: ${responseData.detections.length}`)
    console.log(`- 总数量: ${responseData.pagination.total}`)
    console.log(`- 总页数: ${responseData.pagination.totalPages}`)

    // 3. 测试创建新检测记录
    console.log('\n2. 测试创建新检测记录 (POST /api/miniprogram/detection):')
    
    const newDetectionData = {
      username: testSubUser.username,
      archiveName: `测试检测${Date.now()}`,
      detectionType: 'left_hand_thumb',
      imageUrl: 'https://example.com/test-image.jpg'
    }

    // 2. 调用第三方检测服务（Mock）
    console.log('🔄 开始调用第三方检测服务...')
    const thirdPartyResult = await mockThirdPartyDetection(newDetectionData.imageUrl, newDetectionData.detectionType)
    
    if (!thirdPartyResult.success) {
      console.log('❌ 第三方检测服务调用失败')
      return
    }

    console.log('✅ 第三方检测服务调用成功')
    console.log('📋 第三方检测结果:')
    console.log(`- 图片URL: ${thirdPartyResult.data.imageUrl}`)
    console.log(`- 描述: ${thirdPartyResult.data.description}`)
    console.log(`- 建议: ${thirdPartyResult.data.suggestion}`)
    console.log(`- 结果: ${thirdPartyResult.data.result}`)
    console.log(`- 置信度: ${thirdPartyResult.data.confidence}`)
    console.log(`- 检测类型: ${thirdPartyResult.data.detectionType}`)

    // 3. 创建检测记录
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName: newDetectionData.archiveName,
        detectionType: newDetectionData.detectionType,
        imageUrl: newDetectionData.imageUrl,
        result: thirdPartyResult.data.result,
        confidence: thirdPartyResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${newDetectionData.detectionType}, 置信度: ${thirdPartyResult.data.confidence}`
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

    console.log('✅ 新检测记录创建成功:')
    console.log(`- 档案名称: ${newDetection.archiveName}`)
    console.log(`- 检测类型: ${newDetection.detectionType}`)
    console.log(`- 结果: ${newDetection.result}`)
    console.log(`- 置信度: ${newDetection.confidence}`)
    console.log(`- 状态: ${newDetection.status}`)

    // 4. 更新子用户的检测数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: 1
        }
      }
    })

    console.log('✅ 子用户检测数量已更新')

    // 5. 构建响应数据
    const finalResponseData = {
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

    console.log('📋 最终响应数据:')
    console.log(`- 检测记录ID: ${finalResponseData.detection.id}`)
    console.log(`- 第三方描述: ${finalResponseData.thirdPartyResult.description}`)
    console.log(`- 第三方建议: ${finalResponseData.thirdPartyResult.suggestion}`)

    // 清理测试数据
    await prisma.detection.delete({
      where: { id: newDetection.id }
    })
    console.log('🧹 测试数据已清理')

    console.log('\n✅ 检测接口测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testDetectionApi()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 