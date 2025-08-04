const { PrismaClient } = require('../src/generated/prisma/index.js')

async function testArchiveAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 测试档案API')
    
    // 1. 查找测试用户
    const wechatUser = await prisma.wechatUser.findFirst()
    if (!wechatUser) {
      console.log('❌ 没有找到微信用户')
      return
    }
    
    const subUser = await prisma.subUser.findFirst({
      where: { wechatUserId: wechatUser.id }
    })
    
    if (!subUser) {
      console.log('❌ 没有找到子用户')
      return
    }
    
    console.log('✅ 找到测试用户:', subUser.username)
    
    // 2. 测试创建档案（不带图片）
    console.log('\n📋 测试创建档案（不带图片）...')
    const archiveData = {
      username: subUser.username,
      archiveName: '测试档案_' + Date.now(),
      bodyPart: 'left_hand_thumb'
    }
    
    console.log('📤 请求数据:', JSON.stringify(archiveData, null, 2))
    
    // 模拟API调用
    const newArchive = await prisma.archive.create({
      data: {
        subUserId: subUser.id,
        archiveName: archiveData.archiveName,
        bodyPart: archiveData.bodyPart,
        status: 'active',
        startDate: new Date(),
        totalDetections: 0
      }
    })
    
    console.log('✅ 档案创建成功:', newArchive.id)
    
    // 3. 测试创建档案（带图片）
    console.log('\n📋 测试创建档案（带图片）...')
    const archiveWithImageData = {
      username: subUser.username,
      archiveName: '测试档案_带图片_' + Date.now(),
      bodyPart: 'right_hand_thumb',
      imageUrl: 'http://example.com/test.jpg'
    }
    
    console.log('📤 请求数据:', JSON.stringify(archiveWithImageData, null, 2))
    
    // 创建档案
    const newArchiveWithImage = await prisma.archive.create({
      data: {
        subUserId: subUser.id,
        archiveName: archiveWithImageData.archiveName,
        bodyPart: archiveWithImageData.bodyPart,
        status: 'active',
        startDate: new Date(),
        totalDetections: 1
      }
    })
    
    // 创建检测记录
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveId: newArchiveWithImage.id,
        detectionType: archiveWithImageData.bodyPart,
        imageUrl: archiveWithImageData.imageUrl,
        result: 'normal',
        confidence: 0.9,
        status: 'completed',
        detectionTime: new Date()
      }
    })
    
    console.log('✅ 档案创建成功:', newArchiveWithImage.id)
    console.log('✅ 检测记录创建成功:', newDetection.id)
    
    // 4. 验证数据
    console.log('\n📋 验证数据...')
    const archives = await prisma.archive.findMany({
      where: { subUserId: subUser.id },
      include: { detections: true }
    })
    
    console.log('📊 档案总数:', archives.length)
    archives.forEach((archive, index) => {
      console.log(`  ${index + 1}. ${archive.archiveName}`)
      console.log(`     检测记录数: ${archive.detections.length}`)
      console.log(`     状态: ${archive.status}`)
    })
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testArchiveAPI() 