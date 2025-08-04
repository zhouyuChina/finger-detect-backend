const { PrismaClient } = require('../src/generated/prisma/index.js')

async function checkUsers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查现有用户...')
    
    // 查询所有微信用户
    const wechatUsers = await prisma.wechatUser.findMany({
      select: {
        id: true,
        openid: true,
        nickname: true,
        status: true,
        createdAt: true
      }
    })
    
    console.log('📋 微信用户列表:')
    wechatUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   OpenID: ${user.openid}`)
      console.log(`   昵称: ${user.nickname}`)
      console.log(`   状态: ${user.status}`)
      console.log(`   创建时间: ${user.createdAt.toLocaleString()}`)
      console.log('')
    })
    
    // 查询所有子用户
    const subUsers = await prisma.subUser.findMany({
      select: {
        id: true,
        wechatUserId: true,
        username: true,
        realName: true,
        status: true,
        createdAt: true
      }
    })
    
    console.log('📋 子用户列表:')
    subUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   微信用户ID: ${user.wechatUserId}`)
      console.log(`   用户名: ${user.username}`)
      console.log(`   真实姓名: ${user.realName}`)
      console.log(`   状态: ${user.status}`)
      console.log(`   创建时间: ${user.createdAt.toLocaleString()}`)
      console.log('')
    })
    
    // 显示可用的测试组合
    console.log('🎯 可用的测试组合:')
    wechatUsers.forEach(wechatUser => {
      const relatedSubUsers = subUsers.filter(sub => sub.wechatUserId === wechatUser.id)
      if (relatedSubUsers.length > 0) {
        console.log(`微信用户: ${wechatUser.nickname} (${wechatUser.openid})`)
        relatedSubUsers.forEach(subUser => {
          console.log(`  - 子用户: ${subUser.username} (${subUser.realName})`)
        })
        console.log('')
      }
    })
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers() 