const { PrismaClient } = require('../src/generated/prisma/index.js')

async function testAuth() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔐 测试认证逻辑')
    
    // 1. 查找微信用户
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { openid: 'test_openid_123' }
    })
    
    if (!wechatUser) {
      console.log('❌ 微信用户不存在')
      return
    }
    
    console.log('✅ 找到微信用户:', wechatUser.nickname, 'ID:', wechatUser.id)
    
    // 2. 查找子用户
    const subUsers = await prisma.subUser.findMany({
      where: { wechatUserId: wechatUser.id },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('✅ 找到子用户数量:', subUsers.length)
    subUsers.forEach((subUser, index) => {
      console.log(`  ${index + 1}. ${subUser.username} (${subUser.realName}) - 状态: ${subUser.status}`)
    })
    
    // 3. 模拟认证中间件的逻辑
    const currentSubUser = subUsers.length > 0 ? subUsers[0] : null
    
    const user = {
      id: wechatUser.id,
      openid: wechatUser.openid,
      nickname: wechatUser.nickname,
      subUsers: subUsers,
      currentSubUser: currentSubUser
    }
    
    console.log('✅ 模拟用户对象:', {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      subUsersCount: user.subUsers.length,
      currentSubUser: user.currentSubUser?.username
    })
    
    // 4. 测试查找特定子用户
    const targetUsername = '测试用户'
    const targetSubUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: user.id,
        username: targetUsername,
        status: 'active'
      }
    })
    
    if (targetSubUser) {
      console.log('✅ 找到目标子用户:', targetSubUser.username)
    } else {
      console.log('❌ 未找到目标子用户:', targetUsername)
      
      // 检查所有子用户
      const allSubUsers = await prisma.subUser.findMany({
        where: { wechatUserId: user.id },
        select: { id: true, username: true, realName: true, status: true }
      })
      console.log('📋 该微信用户的所有子用户:', allSubUsers)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth() 