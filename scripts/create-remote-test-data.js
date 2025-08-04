const { PrismaClient } = require('../src/generated/prisma/index.js')

async function createRemoteTestData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🌐 为远程服务器创建测试数据')
    
    // 1. 检查现有数据
    const existingUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true
      }
    })
    
    console.log(`现有微信用户数量: ${existingUsers.length}`)
    
    // 2. 创建测试微信用户
    const testWechatUser = await prisma.wechatUser.upsert({
      where: { openid: 'test_openid_123' },
      update: {},
      create: {
        openid: 'test_openid_123',
        unionid: 'test_unionid_123',
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.jpg',
        gender: '1',
        country: 'China',
        province: 'Beijing',
        city: 'Beijing',
        status: 'active'
      }
    })
    
    console.log('✅ 微信用户:', testWechatUser.nickname)
    
    // 3. 创建测试子用户
    const testSubUser = await prisma.subUser.upsert({
      where: { username: '测试用户' },
      update: {},
      create: {
        wechatUserId: testWechatUser.id,
        username: '测试用户',
        realName: '测试用户',
        status: 'active'
      }
    })
    
    console.log('✅ 子用户:', testSubUser.username)
    
    // 4. 创建测试档案
    const testArchives = [
      {
        archiveName: '左手食指',
        bodyPart: 'fingerprint',
        activity: 'high',
        photoCount: 2
      },
      {
        archiveName: '右手拇指',
        bodyPart: 'fingerprint',
        activity: 'medium',
        photoCount: 1
      }
    ]
    
    console.log('\n📋 创建测试档案:')
    
    for (const archiveData of testArchives) {
      const existingArchive = await prisma.archive.findFirst({
        where: {
          subUserId: testSubUser.id,
          archiveName: archiveData.archiveName
        }
      })
      
      if (existingArchive) {
        console.log(`  ⚠️ 档案已存在: ${archiveData.archiveName}`)
        continue
      }
      
      const archive = await prisma.archive.create({
        data: {
          subUserId: testSubUser.id,
          archiveName: archiveData.archiveName,
          bodyPart: archiveData.bodyPart,
          activity: archiveData.activity,
          photoCount: archiveData.photoCount,
          detectionTime: new Date()
        }
      })
      
      console.log(`  ✅ 创建档案: ${archive.archiveName}`)
      
      // 5. 为档案创建检测记录
      for (let i = 0; i < archiveData.photoCount; i++) {
        const detection = await prisma.detection.create({
          data: {
            subUserId: testSubUser.id,
            archiveName: archiveData.archiveName,
            detectionType: archiveData.bodyPart,
            imageUrl: `http://example.com/images/${archiveData.archiveName}_${i + 1}.jpg`,
            result: i === 0 ? 'normal' : 'abnormal',
            confidence: 0.8 + Math.random() * 0.2,
            status: 'completed',
            detectionTime: new Date()
          }
        })
        
        console.log(`    📸 检测记录 ${i + 1}: ${detection.imageUrl}`)
      }
    }
    
    // 6. 更新子用户统计
    const archiveCount = await prisma.archive.count({
      where: { subUserId: testSubUser.id }
    })
    
    const photoCount = await prisma.detection.count({
      where: { subUserId: testSubUser.id }
    })
    
    await prisma.subUser.update({
      where: { id: testSubUser.id },
      data: {
        archives: archiveCount,
        photos: photoCount
      }
    })
    
    console.log('\n📊 最终统计:')
    console.log(`档案数量: ${archiveCount}`)
    console.log(`检测记录数量: ${photoCount}`)
    
    // 7. 验证数据
    const finalUser = await prisma.wechatUser.findUnique({
      where: { openid: 'test_openid_123' },
      include: {
        subUsers: {
          include: {
            archiveList: true,
            detections: true
          }
        }
      }
    })
    
    console.log('\n✅ 验证数据:')
    console.log(`微信用户: ${finalUser.nickname}`)
    console.log(`子用户数量: ${finalUser.subUsers.length}`)
    
    finalUser.subUsers.forEach(subUser => {
      console.log(`\n📁 子用户: ${subUser.username}`)
      console.log(`  档案数量: ${subUser.archiveList.length}`)
      console.log(`  检测记录数量: ${subUser.detections.length}`)
      
      subUser.archiveList.forEach(archive => {
        const relatedDetections = subUser.detections.filter(
          d => d.archiveName === archive.archiveName
        )
        console.log(`    📋 ${archive.archiveName}: ${relatedDetections.length} 条检测记录`)
      })
    })
    
    console.log('\n🎯 测试数据创建完成！')
    console.log('现在可以使用以下参数测试API:')
    console.log('- x-openid: test_openid_123')
    console.log('- username: 测试用户')
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRemoteTestData() 