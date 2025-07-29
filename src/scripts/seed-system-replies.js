const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedSystemReplies() {
  try {
    console.log('开始创建系统消息模拟数据...')
    
    const types = ['system_notice', 'activity_announcement', 'feature_update', 'maintenance_notice', 'security_alert']
    const targetUsers = ['all', 'vip', 'enterprise', 'normal', 'new']
    const statuses = ['draft', 'published', 'expired', 'cancelled']
    const titles = [
      '系统维护通知',
      '新功能上线公告',
      '春节活动预告',
      '安全更新提醒',
      '用户体验优化通知',
      '服务器升级公告',
      '功能使用指南',
      '问题修复通知',
      '版本更新说明',
      '服务条款更新',
      '数据备份完成通知',
      '系统性能优化公告',
      '用户反馈处理通知',
      '节假日服务安排',
      '系统安全检查通知'
    ]
    const contents = [
      '尊敬的用户，我们将于2024年1月15日凌晨2:00-4:00进行系统维护，期间可能影响部分功能使用，请提前做好准备。',
      '我们很高兴地宣布，新的指纹识别算法已经上线，识别精度提升了15%，检测速度提升了30%。',
      '春节即将到来，我们将推出特别优惠活动，所有VIP用户可享受8折优惠，活动时间：2024年1月20日-2月10日。',
      '为了保障您的账户安全，我们已更新了安全协议，请及时更新您的登录密码。',
      '根据用户反馈，我们优化了用户界面，使操作更加直观便捷，新版本将于下周上线。',
      '为了提供更好的服务，我们将于本周六凌晨进行服务器升级，预计维护时间2小时。',
      '我们为您准备了详细的功能使用指南，包含所有新功能的操作说明，请查看帮助中心。',
      '我们已修复了用户反馈的多个问题，包括登录异常、数据同步错误等，感谢您的耐心等待。',
      '新版本v2.1.0已经发布，包含多项功能改进和bug修复，建议您及时更新。',
      '我们更新了服务条款，主要涉及隐私保护相关内容，请仔细阅读并确认。',
      '您的数据备份已完成，所有重要信息已安全保存，您可以放心使用系统。',
      '我们优化了系统性能，响应速度提升了20%，内存使用减少了15%。',
      '感谢您的反馈，我们已处理了您提交的问题，如有其他问题请随时联系我们。',
      '春节期间（1月20日-2月10日）客服服务时间调整为9:00-18:00，祝您节日快乐。',
      '我们已完成系统安全检查，未发现安全漏洞，您的数据安全有保障。'
    ]
    
    // 创建40个系统消息记录
    for (let i = 1; i <= 40; i++) {
      const type = types[i % types.length]
      const targetUser = targetUsers[i % targetUsers.length]
      const status = statuses[i % statuses.length]
      const title = `${titles[i % titles.length]}${i}`
      const content = contents[i % contents.length]
      const readCount = Math.floor(Math.random() * 1000)
      const totalCount = readCount + Math.floor(Math.random() * 500)
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机30天内的时间
      const publishedAt = status === 'published' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null // 发布时间在创建时间后1-7天
      
      // 创建系统消息记录
      const systemReply = await prisma.systemReply.create({
        data: {
          title,
          type,
          targetUsers: targetUser,
          content,
          status,
          readCount,
          totalCount,
          publishedAt
        }
      })

      console.log(`已创建系统消息 ${title}`)
    }
    
    console.log('系统消息模拟数据创建完成！')
  } catch (error) {
    console.error('创建系统消息数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedSystemReplies()
}

module.exports = { seedSystemReplies } 