const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function testArchivePhotoCount() {
  try {
    console.log('🧪 开始测试档案photoCount修复...')

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

    // 2. 查看当前档案状态
    console.log('\n1. 查看当前档案状态:')
    const currentArchives = await prisma.archive.findMany({
      where: {
        subUserId: testSubUser.id
      },
      select: {
        id: true,
        archiveName: true,
        photoCount: true,
        bodyPart: true,
        createdAt: true
      }
    })

    console.log('📊 当前档案列表:')
    currentArchives.forEach((archive, index) => {
      console.log(`  ${index + 1}. ${archive.archiveName}`)
      console.log(`     照片数量: ${archive.photoCount}`)
      console.log(`     检测部位: ${archive.bodyPart}`)
      console.log(`     创建时间: ${archive.createdAt}`)
    })

    // 3. 模拟创建检测记录（会同时创建/更新档案）
    console.log('\n2. 模拟创建检测记录:')
    
    const testArchiveName = `测试档案${Date.now()}`
    const testDetectionType = 'left_hand_thumb'
    const testImageUrl = 'https://example.com/test-image.jpg'

    // 模拟检测结果
    const mockResult = {
      success: true,
      data: {
        imageUrl: testImageUrl,
        description: '左手拇指指甲检测结果正常，指甲表面光滑，颜色均匀，无灰指甲症状。',
        suggestion: '建议继续保持良好的手部卫生习惯，定期修剪指甲，避免指甲损伤。',
        result: 'normal',
        confidence: 0.89,
        detectionType: testDetectionType,
        timestamp: new Date().toISOString()
      }
    }

    // 创建或更新档案记录
    console.log('🔄 创建或更新档案记录...')
    const archive = await prisma.archive.upsert({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      },
      update: {
        photoCount: {
          increment: 1
        },
        detectionTime: new Date(),
        updatedAt: new Date()
      },
      create: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        bodyPart: testDetectionType,
        activity: 'medium',
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

    console.log('✅ 档案记录创建/更新成功:')
    console.log(`- 档案名称: ${archive.archiveName}`)
    console.log(`- 照片数量: ${archive.photoCount}`)
    console.log(`- 检测部位: ${archive.bodyPart}`)
    console.log(`- 创建时间: ${archive.createdAt}`)

    // 4. 创建检测记录
    console.log('\n3. 创建检测记录...')
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        detectionType: testDetectionType,
        imageUrl: testImageUrl,
        result: mockResult.data.result,
        confidence: mockResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${testDetectionType}, 置信度: ${mockResult.data.confidence}`
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
        createdAt: true
      }
    })

    console.log('✅ 检测记录创建成功:')
    console.log(`- 检测ID: ${newDetection.id}`)
    console.log(`- 档案名称: ${newDetection.archiveName}`)
    console.log(`- 检测类型: ${newDetection.detectionType}`)
    console.log(`- 图片URL: ${newDetection.imageUrl}`)
    console.log(`- 结果: ${newDetection.result}`)

    // 5. 再次添加同一档案的检测记录
    console.log('\n4. 为同一档案添加第二次检测记录...')
    
    const secondImageUrl = 'https://example.com/test-image-2.jpg'
    const secondMockResult = {
      success: true,
      data: {
        imageUrl: secondImageUrl,
        description: '左手拇指指甲检测结果正常，指甲状态良好。',
        suggestion: '建议继续保持良好的手部卫生习惯。',
        result: 'normal',
        confidence: 0.92,
        detectionType: testDetectionType,
        timestamp: new Date().toISOString()
      }
    }

    // 更新档案记录（增加照片数量）
    const updatedArchive = await prisma.archive.update({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
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
        archiveName: true,
        photoCount: true,
        bodyPart: true,
        updatedAt: true
      }
    })

    console.log('✅ 档案照片数量更新成功:')
    console.log(`- 档案名称: ${updatedArchive.archiveName}`)
    console.log(`- 照片数量: ${updatedArchive.photoCount}`)
    console.log(`- 更新时间: ${updatedArchive.updatedAt}`)

    // 创建第二次检测记录
    const secondDetection = await prisma.detection.create({
      data: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        detectionType: testDetectionType,
        imageUrl: secondImageUrl,
        result: secondMockResult.data.result,
        confidence: secondMockResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${testDetectionType}, 置信度: ${secondMockResult.data.confidence}`
      },
      select: {
        id: true,
        archiveName: true,
        imageUrl: true,
        result: true,
        createdAt: true
      }
    })

    console.log('✅ 第二次检测记录创建成功:')
    console.log(`- 检测ID: ${secondDetection.id}`)
    console.log(`- 图片URL: ${secondDetection.imageUrl}`)
    console.log(`- 结果: ${secondDetection.result}`)

    // 6. 验证最终状态
    console.log('\n5. 验证最终档案状态:')
    const finalArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      },
      select: {
        id: true,
        archiveName: true,
        photoCount: true,
        bodyPart: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (finalArchive) {
      console.log('📊 最终档案状态:')
      console.log(`- 档案名称: ${finalArchive.archiveName}`)
      console.log(`- 照片数量: ${finalArchive.photoCount} (应该是2)`)
      console.log(`- 检测部位: ${finalArchive.bodyPart}`)
      console.log(`- 创建时间: ${finalArchive.createdAt}`)
      console.log(`- 更新时间: ${finalArchive.updatedAt}`)
      
      if (finalArchive.photoCount === 2) {
        console.log('✅ photoCount 修复成功！')
      } else {
        console.log('❌ photoCount 修复失败！')
      }
    }

    // 7. 清理测试数据
    console.log('\n6. 清理测试数据...')
    await prisma.detection.deleteMany({
      where: {
        archiveName: testArchiveName
      }
    })
    
    await prisma.archive.delete({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      }
    })
    
    console.log('🧹 测试数据已清理')

    console.log('\n✅ 档案photoCount修复测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testArchivePhotoCount()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 