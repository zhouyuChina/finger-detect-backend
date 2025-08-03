const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function debugDetectionAPI() {
  try {
    console.log('🔍 开始调试检测API...\n')

    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...')
    try {
      await prisma.$connect()
      console.log('✅ 数据库连接成功')
    } catch (error) {
      console.log('❌ 数据库连接失败:', error.message)
      return
    }

    // 2. 查找测试用户
    console.log('\n2. 查找测试用户...')
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { openid: 'test_openid_001' }
    })

    if (!wechatUser) {
      console.log('❌ 微信用户不存在: test_openid_001')
      return
    }
    console.log('✅ 找到微信用户:', wechatUser.nickname)

    // 3. 查找子用户
    console.log('\n3. 查找子用户...')
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: wechatUser.id,
        username: 'subuser001',
        status: 'active'
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在: subuser001')
      return
    }
    console.log('✅ 找到子用户:', subUser.realName)

    // 4. 测试档案创建
    console.log('\n4. 测试档案创建...')
    const archiveName = '调试测试档案'
    
    try {
      const archive = await prisma.archive.create({
        data: {
          subUserId: subUser.id,
          archiveName: archiveName,
          bodyPart: 'left_hand_thumb',
          activity: 'medium',
          photoCount: 1,
          detectionTime: new Date()
        }
      })
      console.log('✅ 档案创建成功:', archive.id)
    } catch (error) {
      console.log('❌ 档案创建失败:', error.message)
      if (error.code === 'P2002') {
        console.log('   档案名称已存在，尝试更新...')
        const archive = await prisma.archive.update({
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
            detectionTime: new Date()
          }
        })
        console.log('✅ 档案更新成功:', archive.id)
      }
    }

    // 5. 测试检测记录创建
    console.log('\n5. 测试检测记录创建...')
    try {
      const detection = await prisma.detection.create({
        data: {
          subUserId: subUser.id,
          archiveName: archiveName,
          detectionType: 'left_hand_thumb',
          imageUrl: 'https://example.com/test.jpg',
          result: 'normal',
          confidence: 0.95,
          status: 'completed',
          remark: '调试测试记录'
        }
      })
      console.log('✅ 检测记录创建成功:', detection.id)
    } catch (error) {
      console.log('❌ 检测记录创建失败:', error.message)
      console.log('   错误代码:', error.code)
      console.log('   错误详情:', error.meta)
    }

    // 6. 测试第三方检测服务
    console.log('\n6. 测试第三方检测服务...')
    try {
      const mockResult = await mockThirdPartyDetection('https://example.com/test.jpg', 'left_hand_thumb')
      console.log('✅ 第三方检测服务调用成功')
      console.log('   结果:', mockResult.data.result)
      console.log('   置信度:', mockResult.data.confidence)
    } catch (error) {
      console.log('❌ 第三方检测服务调用失败:', error.message)
    }

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

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

// 运行调试
debugDetectionAPI()
  .then(() => {
    console.log('\n✅ 调试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 调试失败:', error)
    process.exit(1)
  }) 