const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

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
      detectionType: 'fingerprint',
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