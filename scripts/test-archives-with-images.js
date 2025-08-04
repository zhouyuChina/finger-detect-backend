const { PrismaClient } = require('../src/generated/prisma/index.js')

async function testArchivesWithImages() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 测试档案API返回图片信息')
    
    // 1. 检查现有数据
    console.log('\n📊 检查现有数据:')
    
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: {
          include: {
            archiveList: true,
            detections: true
          }
        }
      }
    })
    
    console.log(`微信用户数量: ${wechatUsers.length}`)
    
    wechatUsers.forEach(user => {
      console.log(`\n👤 微信用户: ${user.nickname} (${user.openid})`)
      console.log(`子用户数量: ${user.subUsers.length}`)
      
      user.subUsers.forEach(subUser => {
        console.log(`  📁 子用户: ${subUser.username} (${subUser.realName})`)
        console.log(`    档案数量: ${subUser.archiveList.length}`)
        console.log(`    检测记录数量: ${subUser.detections.length}`)
        
        // 显示档案和检测记录的对应关系
        subUser.archiveList.forEach(archive => {
          const relatedDetections = subUser.detections.filter(
            d => d.archiveName === archive.archiveName
          )
          console.log(`    📋 档案: ${archive.archiveName}`)
          console.log(`       检测记录: ${relatedDetections.length} 条`)
          if (relatedDetections.length > 0) {
            const latest = relatedDetections.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            )[0]
            console.log(`       最新图片: ${latest.imageUrl}`)
            console.log(`       检测结果: ${latest.result}`)
          }
        })
      })
    })
    
    // 2. 模拟API调用
    if (wechatUsers.length > 0 && wechatUsers[0].subUsers.length > 0) {
      const testUser = wechatUsers[0]
      const testSubUser = testUser.subUsers[0]
      
      console.log('\n🔍 模拟API调用:')
      console.log(`测试用户: ${testUser.nickname}`)
      console.log(`测试子用户: ${testSubUser.username}`)
      
      // 模拟API逻辑
      const archives = await prisma.archive.findMany({
        where: {
          subUserId: testSubUser.id
        },
        select: {
          id: true,
          archiveName: true,
          activity: true,
          photoCount: true,
          bodyPart: true,
          detectionTime: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`\n📋 档案列表 (${archives.length} 条):`)
      
      const archivesWithImages = await Promise.all(
        archives.map(async (archive) => {
          const latestDetection = await prisma.detection.findFirst({
            where: {
              subUserId: testSubUser.id,
              archiveName: archive.archiveName
            },
            select: {
              imageUrl: true,
              result: true,
              confidence: true,
              detectionTime: true
            },
            orderBy: { createdAt: 'desc' }
          })
          
          const result = {
            id: archive.id,
            archiveName: archive.archiveName,
            activity: archive.activity,
            photoCount: archive.photoCount,
            bodyPart: archive.bodyPart,
            detectionTime: archive.detectionTime,
            createdAt: archive.createdAt,
            updatedAt: archive.updatedAt,
            imageUrl: latestDetection?.imageUrl || null,
            result: latestDetection?.result || null,
            confidence: latestDetection?.confidence || null,
            latestDetectionTime: latestDetection?.detectionTime || null
          }
          
          console.log(`\n  📁 ${archive.archiveName}:`)
          console.log(`    图片: ${result.imageUrl || '无图片'}`)
          console.log(`    结果: ${result.result || '无结果'}`)
          console.log(`    置信度: ${result.confidence || '无'}`)
          console.log(`    最新检测: ${result.latestDetectionTime || '无'}`)
          
          return result
        })
      )
      
      console.log('\n✅ 测试完成')
      console.log(`返回 ${archivesWithImages.length} 个档案，包含图片信息`)
      
    } else {
      console.log('\n⚠️ 没有测试数据，请先创建用户和档案数据')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testArchivesWithImages() 