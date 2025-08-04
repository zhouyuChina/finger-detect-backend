const { PrismaClient } = require('../src/generated/prisma/index.js')

async function createTestArchivesData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 创建档案测试数据')
    
    // 1. 查找现有用户
    const wechatUser = await prisma.wechatUser.findFirst({
      include: {
        subUsers: true
      }
    })
    
    if (!wechatUser || wechatUser.subUsers.length === 0) {
      console.log('❌ 没有找到用户，请先创建用户')
      return
    }
    
    const subUser = wechatUser.subUsers[0]
    console.log(`✅ 使用用户: ${wechatUser.nickname} - ${subUser.username}`)
    
    // 2. 创建测试档案
    const testArchives = [
      {
        archiveName: '左手食指',
        bodyPart: 'fingerprint',
        activity: 'high',
        photoCount: 3
      },
      {
        archiveName: '右手拇指',
        bodyPart: 'fingerprint', 
        activity: 'medium',
        photoCount: 2
      },
      {
        archiveName: '面部识别',
        bodyPart: 'face',
        activity: 'low',
        photoCount: 1
      }
    ]
    
    console.log('\n📋 创建档案:')
    
    for (const archiveData of testArchives) {
      // 检查档案是否已存在
      const existingArchive = await prisma.archive.findFirst({
        where: {
          subUserId: subUser.id,
          archiveName: archiveData.archiveName
        }
      })
      
      if (existingArchive) {
        console.log(`  ⚠️ 档案已存在: ${archiveData.archiveName}`)
        continue
      }
      
      // 创建档案
      const archive = await prisma.archive.create({
        data: {
          subUserId: subUser.id,
          archiveName: archiveData.archiveName,
          bodyPart: archiveData.bodyPart,
          activity: archiveData.activity,
          photoCount: archiveData.photoCount,
          detectionTime: new Date()
        }
      })
      
      console.log(`  ✅ 创建档案: ${archive.archiveName}`)
      
      // 3. 为每个档案创建检测记录
      const detectionCount = archiveData.photoCount
      console.log(`    📸 创建 ${detectionCount} 条检测记录:`)
      
      for (let i = 0; i < detectionCount; i++) {
        const isFirst = i === 0 // 第一条是创建档案时的记录
        const detectionTime = new Date()
        detectionTime.setMinutes(detectionTime.getMinutes() - i * 30) // 每条记录间隔30分钟
        
        const detection = await prisma.detection.create({
          data: {
            subUserId: subUser.id,
            archiveName: archiveData.archiveName,
            detectionType: archiveData.bodyPart,
            imageUrl: `http://example.com/images/${archiveData.archiveName}_${i + 1}.jpg`,
            result: isFirst ? 'normal' : (Math.random() > 0.7 ? 'abnormal' : 'normal'),
            confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
            status: 'completed',
            detectionTime: detectionTime
          }
        })
        
        console.log(`      ✅ 检测记录 ${i + 1}: ${detection.imageUrl} (${detection.result})`)
      }
      
      // 4. 更新子用户的档案数量
      await prisma.subUser.update({
        where: { id: subUser.id },
        data: {
          archives: {
            increment: 1
          },
          photos: {
            increment: detectionCount
          }
        }
      })
    }
    
    console.log('\n✅ 测试数据创建完成')
    
    // 5. 验证数据
    const finalArchives = await prisma.archive.findMany({
      where: { subUserId: subUser.id }
    })
    
    console.log('\n📊 验证数据:')
    console.log(`档案总数: ${finalArchives.length}`)
    
    for (const archive of finalArchives) {
      console.log(`\n📁 ${archive.archiveName}:`)
      
      // 查询该档案的检测记录
      const detections = await prisma.detection.findMany({
        where: {
          subUserId: subUser.id,
          archiveName: archive.archiveName
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`  检测记录: ${detections.length} 条`)
      if (detections.length > 0) {
        const latest = detections[0]
        console.log(`  最新图片: ${latest.imageUrl}`)
        console.log(`  检测结果: ${latest.result}`)
        console.log(`  置信度: ${latest.confidence.toFixed(2)}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestArchivesData() 