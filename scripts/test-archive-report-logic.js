const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

// Mock 第三方检测服务
async function mockThirdPartyDetection(imageUrl, detectionType) {
  console.log('🤖 调用第三方检测服务 (Mock)')
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
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
    }
  }
  
  // 随机生成结果
  const isNormal = Math.random() > 0.3
  const resultType = isNormal ? 'normal' : 'abnormal'
  const result = results[detectionType]?.[resultType] || results.left_hand_thumb.normal
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

async function testArchiveReportLogic() {
  try {
    console.log('🧪 开始测试档案报告逻辑...')

    // 1. 获取测试用户
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
    console.log(`📋 使用测试用户: ${testSubUser.realName} (${testSubUser.username})`)

    const testArchiveName = `测试档案${Date.now()}`
    const testDetectionType = 'left_hand_thumb'

    // 2. 第一次检测 - 应该创建档案和报告
    console.log('\n1. 第一次检测 - 创建档案和报告:')
    
    const firstImageUrl = 'https://example.com/first-image.jpg'
    const firstResult = await mockThirdPartyDetection(firstImageUrl, testDetectionType)
    
    // 检查档案是否存在
    const existingArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      }
    })

    // 检查该档案是否有检测记录
    const existingDetections = existingArchive ? await prisma.detection.findMany({
      where: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        status: 'completed'
      },
      select: { id: true, result: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }) : []

    let isNewArchive = false
    let archive

    if (existingArchive) {
      if (existingDetections.length > 0) {
        console.log('📸 档案已存在且有报告，这是治疗过程中的拍照')
        // 只更新照片数量，不创建报告
        archive = await prisma.archive.update({
          where: {
            subUserId_archiveName: {
              subUserId: testSubUser.id,
              archiveName: testArchiveName
            }
          },
          data: {
            photoCount: { increment: 1 },
            detectionTime: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('✅ 治疗拍照完成，照片数量:', archive.photoCount)
        return
      } else {
        console.log('📋 档案存在但无报告，创建第一份报告')
        isNewArchive = false
      }
    } else {
      console.log('🆕 新档案，创建第一份报告')
      isNewArchive = true
    }

    // 创建或更新档案
    if (isNewArchive) {
      archive = await prisma.archive.create({
        data: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName,
          bodyPart: testDetectionType,
          activity: 'medium',
          photoCount: 1,
          detectionTime: new Date()
        }
      })
    } else {
      archive = await prisma.archive.update({
        where: {
          subUserId_archiveName: {
            subUserId: testSubUser.id,
            archiveName: testArchiveName
          }
        },
        data: {
          photoCount: { increment: 1 },
          detectionTime: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // 创建检测记录（报告）
    const firstDetection = await prisma.detection.create({
      data: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        detectionType: testDetectionType,
        imageUrl: firstImageUrl,
        result: firstResult.data.result,
        confidence: firstResult.data.confidence,
        status: 'completed',
        remark: `检测类型: ${testDetectionType}, 置信度: ${firstResult.data.confidence}`
      }
    })

    console.log('✅ 第一份报告创建成功:')
    console.log(`- 档案名称: ${archive.archiveName}`)
    console.log(`- 照片数量: ${archive.photoCount}`)
    console.log(`- 检测结果: ${firstDetection.result}`)
    console.log(`- 置信度: ${firstDetection.confidence}`)

    // 3. 第二次检测 - 应该只是治疗拍照，不创建报告
    console.log('\n2. 第二次检测 - 治疗过程拍照:')
    
    const secondImageUrl = 'https://example.com/second-image.jpg'
    const secondResult = await mockThirdPartyDetection(secondImageUrl, testDetectionType)
    
    // 再次检查档案
    const updatedArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      }
    })

    const updatedDetections = updatedArchive ? await prisma.detection.findMany({
      where: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        status: 'completed'
      },
      select: { id: true, result: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }) : []

    if (updatedArchive && updatedDetections.length > 0) {
      console.log('📸 档案已存在且有报告，这是治疗过程中的拍照')
      
      // 只更新照片数量，不创建新的检测记录
      const finalArchive = await prisma.archive.update({
        where: {
          subUserId_archiveName: {
            subUserId: testSubUser.id,
            archiveName: testArchiveName
          }
        },
        data: {
          photoCount: { increment: 1 },
          detectionTime: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('✅ 治疗拍照完成:')
      console.log(`- 档案名称: ${finalArchive.archiveName}`)
      console.log(`- 照片数量: ${finalArchive.photoCount}`)
      console.log(`- 检测记录数量: ${updatedDetections.length}`)
    }

    // 4. 第三次检测 - 再次治疗拍照
    console.log('\n3. 第三次检测 - 再次治疗拍照:')
    
    const thirdImageUrl = 'https://example.com/third-image.jpg'
    const thirdResult = await mockThirdPartyDetection(thirdImageUrl, testDetectionType)
    
    const finalArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      }
    })

    const finalDetections = finalArchive ? await prisma.detection.findMany({
      where: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        status: 'completed'
      },
      select: { id: true, result: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }) : []

    if (finalArchive && finalDetections.length > 0) {
      // 只更新照片数量
      const updatedFinalArchive = await prisma.archive.update({
        where: {
          subUserId_archiveName: {
            subUserId: testSubUser.id,
            archiveName: testArchiveName
          }
        },
        data: {
          photoCount: { increment: 1 },
          detectionTime: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('✅ 第三次治疗拍照完成:')
      console.log(`- 档案名称: ${updatedFinalArchive.archiveName}`)
      console.log(`- 照片数量: ${updatedFinalArchive.photoCount}`)
      console.log(`- 检测记录数量: ${finalDetections.length}`)
    }

    // 5. 验证最终状态
    console.log('\n4. 验证最终状态:')
    const verificationArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: testSubUser.id,
          archiveName: testArchiveName
        }
      }
    })

    const verificationDetections = verificationArchive ? await prisma.detection.findMany({
      where: {
        subUserId: testSubUser.id,
        archiveName: testArchiveName,
        status: 'completed'
      },
      select: { id: true, result: true, confidence: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }) : []

    if (verificationArchive) {
      console.log('📊 最终档案状态:')
      console.log(`- 档案名称: ${verificationArchive.archiveName}`)
      console.log(`- 照片数量: ${verificationArchive.photoCount}`)
      console.log(`- 检测记录数量: ${verificationDetections.length}`)
      
      verificationDetections.forEach((detection, index) => {
        console.log(`  ${index + 1}. 检测记录: ${detection.result} (置信度: ${detection.confidence})`)
      })

      // 验证业务逻辑
      if (verificationDetections.length === 1 && verificationArchive.photoCount === 3) {
        console.log('✅ 业务逻辑验证成功：')
        console.log('  - 只有一份报告（第一次检测）')
        console.log('  - 照片数量正确（3张照片）')
        console.log('  - 后续检测只是治疗拍照，不生成报告')
      } else {
        console.log('❌ 业务逻辑验证失败！')
      }
    }

    // 6. 清理测试数据
    console.log('\n5. 清理测试数据...')
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

    console.log('\n✅ 档案报告逻辑测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testArchiveReportLogic()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 