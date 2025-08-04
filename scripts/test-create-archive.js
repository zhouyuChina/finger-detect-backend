const { PrismaClient } = require('../src/generated/prisma/index.js')

async function testCreateArchive() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 测试新增档案接口')
    
    // 1. 检查现有数据
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: {
          include: {
            archiveList: true
          }
        }
      }
    })
    
    if (wechatUsers.length === 0) {
      console.log('❌ 没有找到用户数据')
      return
    }
    
    const testUser = wechatUsers[0]
    const testSubUser = testUser.subUsers[0]
    
    console.log(`\n👤 测试用户: ${testUser.nickname} (${testUser.openid})`)
    console.log(`📁 子用户: ${testSubUser.username} (${testSubUser.realName})`)
    console.log(`📋 现有档案数量: ${testSubUser.archiveList.length}`)
    
    // 2. 模拟API调用参数
    const testData = {
      username: testSubUser.username,
      archiveName: '测试档案_' + Date.now(),
      bodyPart: 'fingerprint',
      activity: 'high',
      photoCount: 0
    }
    
    console.log('\n📝 测试数据:')
    console.log(JSON.stringify(testData, null, 2))
    
    // 3. 模拟API逻辑
    console.log('\n🔍 执行API逻辑:')
    
    // 3.1 查找子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: testUser.id,
        username: testData.username,
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
    
    // 3.2 检查档案名称是否已存在
    const existingArchive = await prisma.archive.findFirst({
      where: {
        subUserId: subUser.id,
        archiveName: testData.archiveName
      }
    })
    
    if (existingArchive) {
      console.log('❌ 档案名称已存在:', testData.archiveName)
      return
    }
    
    console.log('✅ 档案名称可用')
    
    // 3.3 创建新档案
    const newArchive = await prisma.archive.create({
      data: {
        subUserId: subUser.id,
        archiveName: testData.archiveName,
        bodyPart: testData.bodyPart,
        activity: testData.activity,
        photoCount: testData.photoCount,
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
    
    console.log('✅ 档案创建成功:', newArchive.archiveName)
    console.log('📋 档案详情:', JSON.stringify(newArchive, null, 2))
    
    // 3.4 更新子用户的档案数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        archives: {
          increment: 1
        }
      }
    })
    
    console.log('✅ 子用户档案数量已更新')
    
    // 4. 验证结果
    const updatedSubUser = await prisma.subUser.findUnique({
      where: { id: subUser.id },
      include: {
        archiveList: true
      }
    })
    
    console.log('\n📊 验证结果:')
    console.log(`子用户档案数量: ${updatedSubUser.archives}`)
    console.log(`档案列表数量: ${updatedSubUser.archiveList.length}`)
    
    const createdArchive = updatedSubUser.archiveList.find(
      a => a.archiveName === testData.archiveName
    )
    
    if (createdArchive) {
      console.log('✅ 档案已成功添加到数据库')
      console.log('📋 档案详情:', JSON.stringify(createdArchive, null, 2))
    } else {
      console.log('❌ 档案未找到')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateArchive() 