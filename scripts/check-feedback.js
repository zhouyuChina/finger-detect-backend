const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function checkFeedback() {
  try {
    console.log('🔍 检查反馈数据...')
    
    // 查询所有反馈
    const feedbacks = await prisma.feedback.findMany({
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            openid: true
          }
        }
      }
    })
    
    console.log('📋 反馈总数:', feedbacks.length)
    
    if (feedbacks.length > 0) {
      console.log('📝 反馈列表:')
      feedbacks.forEach((feedback, index) => {
        console.log(`${index + 1}. ID: ${feedback.id}`)
        console.log(`   标题: ${feedback.title}`)
        console.log(`   类型: ${feedback.type}`)
        console.log(`   状态: ${feedback.status}`)
        console.log(`   用户: ${feedback.wechatUser?.nickname || '未知'} (${feedback.wechatUser?.id})`)
        console.log(`   创建时间: ${feedback.createdAt}`)
        console.log('---')
      })
    } else {
      console.log('❌ 没有找到反馈数据')
    }
    
    // 查询微信用户
    const wechatUsers = await prisma.wechatUser.findMany({
      select: {
        id: true,
        nickname: true,
        openid: true
      }
    })
    
    console.log('\n👥 微信用户列表:')
    wechatUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   昵称: ${user.nickname}`)
      console.log(`   OpenID: ${user.openid}`)
      console.log('---')
    })
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkFeedback() 