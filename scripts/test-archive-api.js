const { PrismaClient } = require('../src/generated/prisma/index.js')

async function testArchiveAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 测试档案API逻辑')
    
    // 1. 查找微信用户
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { openid: 'test_openid_123' }
    })
    
    if (!wechatUser) {
      console.log('❌ 微信用户不存在')
      return
    }
    
    console.log('✅ 找到微信用户:', wechatUser.nickname)
    
    // 2. 查找子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: wechatUser.id,
        username: '测试用户',
        status: 'active'
      }
    })
    
    if (!subUser) {
      console.log('❌ 子用户不存在')
      return
    }
    
    console.log('✅ 找到子用户:', subUser.username)
    
    // 3. 查询档案列表
    const archives = await prisma.archive.findMany({
      where: {
        subUserId: subUser.id
      },
      select: {
        id: true,
        archiveName: true,
        status: true,
        totalDetections: true,
        bodyPart: true,
        startDate: true,
        lastDetectionTime: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('✅ 找到档案数量:', archives.length)
    
    // 4. 为每个档案获取最新检测记录
    const archivesWithImages = await Promise.all(
      archives.map(async (archive) => {
        const latestDetection = await prisma.detection.findFirst({
          where: {
            archiveId: archive.id
          },
          select: {
            imageUrl: true,
            result: true,
            confidence: true,
            detectionTime: true
          },
          orderBy: { createdAt: 'desc' }
        })
        
        return {
          id: archive.id,
          archiveName: archive.archiveName,
          status: archive.status,
          totalDetections: archive.totalDetections,
          bodyPart: archive.bodyPart,
          startDate: archive.startDate,
          lastDetectionTime: archive.lastDetectionTime,
          createdAt: archive.createdAt,
          updatedAt: archive.updatedAt,
          imageUrl: latestDetection?.imageUrl || null,
          result: latestDetection?.result || null,
          confidence: latestDetection?.confidence || null,
          latestDetectionTime: latestDetection?.detectionTime || null
        }
      })
    )
    
    console.log('✅ 档案列表处理完成')
    console.log('📋 档案详情:')
    archivesWithImages.forEach((archive, index) => {
      console.log(`  ${index + 1}. ${archive.archiveName}`)
      console.log(`     状态: ${archive.status}`)
      console.log(`     检测次数: ${archive.totalDetections}`)
      console.log(`     最新图片: ${archive.imageUrl || '无'}`)
      console.log(`     检测结果: ${archive.result || '无'}`)
    })
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testArchiveAPI() 