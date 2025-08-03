const { PrismaClient } = require('../src/generated/prisma/index.js')

async function fixDefaultSubUserSelection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 修复默认用户选择逻辑...\n')
    
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    console.log(`📊 找到 ${wechatUsers.length} 个微信用户\n`)
    
    for (const wechatUser of wechatUsers) {
      console.log(`👤 微信用户: ${wechatUser.nickname} (${wechatUser.openid})`)
      console.log(`   子用户数量: ${wechatUser.subUsers.length}`)
      
      if (wechatUser.subUsers.length > 0) {
        console.log('   子用户列表:')
        wechatUser.subUsers.forEach((subUser, index) => {
          console.log(`     ${index + 1}. ${subUser.realName} (${subUser.username}) - ID: ${subUser.id}`)
        })
        
        // 找到代表用户本人的子用户（默认用户）
        const defaultSubUser = wechatUser.subUsers.find(subUser => 
          subUser.username === wechatUser.nickname || 
          subUser.realName === wechatUser.nickname ||
          subUser.username === `user_${wechatUser.openid.slice(-6)}`
        )
        
        if (defaultSubUser) {
          console.log(`   ✅ 找到默认用户: ${defaultSubUser.realName} (${defaultSubUser.username})`)
          console.log(`   📍 默认用户ID: ${defaultSubUser.id}`)
        } else {
          console.log(`   ❌ 没有找到默认用户，使用第一个子用户`)
          const firstSubUser = wechatUser.subUsers[0]
          console.log(`   📍 第一个子用户: ${firstSubUser.realName} (${firstSubUser.username})`)
        }
      } else {
        console.log('   ❌ 没有子用户')
      }
      
      console.log('---\n')
    }
    
    // 测试注册接口的返回值
    console.log('🧪 测试修复后的注册接口...')
    
    const testData = {
      openid: 'test_fix_' + Date.now(),
      nickname: '修复测试用户',
      appVersion: '1.0.0'
    }
    
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (result.success) {
      const user = result.data.user
      console.log('✅ 注册成功')
      console.log('用户信息:', {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname
      })
      console.log('子用户数量:', user.subUsers.length)
      
      if (user.subUsers.length > 0) {
        console.log('子用户列表:')
        user.subUsers.forEach((subUser, index) => {
          console.log(`  ${index + 1}. ${subUser.realName} (${subUser.username}) - ID: ${subUser.id}`)
        })
        
        console.log('currentSubUser (默认用户):')
        console.log(`  ${user.currentSubUser.realName} (${user.currentSubUser.username}) - ID: ${user.currentSubUser.id}`)
        
        // 验证currentSubUser是否是默认用户
        const isDefaultUser = user.currentSubUser.username === user.nickname || 
                             user.currentSubUser.realName === user.nickname ||
                             user.currentSubUser.username === `user_${user.openid.slice(-6)}`
        
        if (isDefaultUser) {
          console.log('✅ currentSubUser 是正确的默认用户')
        } else {
          console.log('❌ currentSubUser 不是默认用户')
        }
      }
    } else {
      console.log('❌ 注册失败:', result.message)
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixDefaultSubUserSelection() 