const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function fixDefaultSubUsers() {
  try {
    console.log('🔧 开始修复默认子用户...\n')

    // 1. 获取所有微信用户
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true
      }
    })

    console.log(`📊 找到 ${wechatUsers.length} 个微信用户`)

    let fixedCount = 0
    let skippedCount = 0

    for (const wechatUser of wechatUsers) {
      console.log(`\n👤 检查用户: ${wechatUser.nickname} (${wechatUser.openid})`)
      console.log(`   子用户数量: ${wechatUser.subUsers.length}`)

      if (wechatUser.subUsers.length === 0) {
        // 没有子用户，创建默认子用户
        console.log('   ❌ 缺少默认子用户，正在创建...')
        
        const defaultUsername = wechatUser.nickname || `user_${wechatUser.openid.slice(-6)}`
        
        try {
          const defaultSubUser = await prisma.subUser.create({
            data: {
              wechatUserId: wechatUser.id,
              username: defaultUsername,
              realName: wechatUser.nickname || '默认用户',
              status: 'active'
            }
          })
          
          console.log(`   ✅ 默认子用户创建成功: ${defaultSubUser.realName} (${defaultSubUser.username})`)
          fixedCount++
        } catch (error) {
          console.log(`   ❌ 创建默认子用户失败: ${error.message}`)
        }
      } else {
        console.log('   ✅ 已有子用户，跳过')
        skippedCount++
      }
    }

    console.log('\n📋 修复结果:')
    console.log(`  - 修复用户数: ${fixedCount}`)
    console.log(`  - 跳过用户数: ${skippedCount}`)
    console.log(`  - 总用户数: ${wechatUsers.length}`)

    // 2. 验证修复结果
    console.log('\n🔍 验证修复结果...')
    const allWechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true
      }
    })

    const usersWithoutSubUsers = allWechatUsers.filter(user => user.subUsers.length === 0)
    
    if (usersWithoutSubUsers.length === 0) {
      console.log('✅ 所有微信用户都有默认子用户')
    } else {
      console.log(`❌ 仍有 ${usersWithoutSubUsers.length} 个用户没有子用户:`)
      usersWithoutSubUsers.forEach(user => {
        console.log(`   - ${user.nickname} (${user.openid})`)
      })
    }

    // 3. 显示所有用户和子用户信息
    console.log('\n📊 所有用户和子用户信息:')
    for (const user of allWechatUsers) {
      console.log(`\n👤 ${user.nickname} (${user.openid})`)
      if (user.subUsers.length > 0) {
        user.subUsers.forEach((subUser, index) => {
          console.log(`   ${index + 1}. ${subUser.realName} (${subUser.username}) - ${subUser.status}`)
        })
      } else {
        console.log('   ❌ 没有子用户')
      }
    }

  } catch (error) {
    console.error('❌ 修复默认子用户失败:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行修复
fixDefaultSubUsers()
  .then(() => {
    console.log('\n✅ 修复脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 修复脚本执行失败:', error)
    process.exit(1)
  }) 