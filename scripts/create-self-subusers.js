const { PrismaClient } = require('../src/generated/prisma/index.js')

async function createSelfSubUsers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 开始为现有用户创建代表本人的子用户...\n')
    
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true
      }
    })
    
    console.log(`📊 找到 ${wechatUsers.length} 个微信用户`)
    
    let createdCount = 0
    let skippedCount = 0
    
    for (const wechatUser of wechatUsers) {
      console.log(`\n👤 检查用户: ${wechatUser.nickname} (${wechatUser.openid})`)
      console.log(`   现有子用户: ${wechatUser.subUsers.length} 个`)
      
      // 检查是否有代表用户本人的子用户
      const hasSelfSubUser = wechatUser.subUsers.some(subUser => 
        subUser.username === wechatUser.nickname || 
        subUser.realName === wechatUser.nickname ||
        subUser.username === `user_${wechatUser.openid.slice(-6)}`
      )
      
      if (hasSelfSubUser) {
        console.log('   ✅ 已有代表本人的子用户，跳过')
        skippedCount++
        continue
      }
      
      // 创建代表用户本人的子用户
      let selfUsername = wechatUser.nickname || `user_${wechatUser.openid.slice(-6)}`
      
      // 检查用户名是否已存在
      let existingSubUser = await prisma.subUser.findUnique({
        where: { username: selfUsername }
      })
      
      if (existingSubUser) {
        console.log(`   ⚠️ 用户名 "${selfUsername}" 已存在，添加时间戳`)
        selfUsername = `${selfUsername}_${Date.now()}`
      }
      
      const selfSubUser = await prisma.subUser.create({
        data: {
          wechatUserId: wechatUser.id,
          username: selfUsername,
          realName: wechatUser.nickname || '微信用户',
          status: 'active'
        }
      })
      
      console.log(`   ✅ 创建代表本人的子用户: ${selfSubUser.realName} (${selfSubUser.username})`)
      createdCount++
    }
    
    console.log(`\n📋 处理结果:`)
    console.log(`  - 创建子用户数: ${createdCount}`)
    console.log(`  - 跳过用户数: ${skippedCount}`)
    console.log(`  - 总用户数: ${wechatUsers.length}`)
    
    // 显示所有用户的子用户列表
    console.log(`\n📋 所有用户的子用户列表:`)
    for (const wechatUser of wechatUsers) {
      const updatedUser = await prisma.wechatUser.findUnique({
        where: { id: wechatUser.id },
        include: { subUsers: true }
      })
      
      console.log(`\n👤 ${updatedUser.nickname} (${updatedUser.openid}):`)
      updatedUser.subUsers.forEach((subUser, index) => {
        const isSelf = subUser.username === updatedUser.nickname || 
                      subUser.realName === updatedUser.nickname ||
                      subUser.username === `user_${updatedUser.openid.slice(-6)}`
        console.log(`   ${index + 1}. ${subUser.realName} (${subUser.username}) ${isSelf ? '👤本人' : ''}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 创建代表本人的子用户失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSelfSubUsers() 