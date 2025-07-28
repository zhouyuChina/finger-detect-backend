const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedFeedbacks() {
  try {
    console.log('开始创建反馈模拟数据...')
    
    // 获取现有的用户ID列表
    const users = await prisma.user.findMany({
      select: { id: true, nickname: true }
    })
    
    if (users.length === 0) {
      console.log('没有找到用户数据，请先运行 seed-user-management.js')
      return
    }
    
    const feedbackTypes = ['bug', 'suggestion', 'complaint']
    const feedbackStatuses = ['pending', 'processing', 'resolved', 'rejected']
    const titles = [
      '应用经常卡顿，希望能优化性能',
      '建议增加夜间模式功能',
      '希望增加更多的检测部位',
      '报告生成速度太慢',
      '界面设计可以更美观一些',
      '希望能支持批量导出功能',
      '检测精度需要提高',
      '用户界面操作不够直观',
      '希望能增加数据备份功能',
      '建议增加用户使用教程',
      '登录验证码显示异常',
      '希望增加数据统计功能',
      '检测结果保存失败',
      '希望优化移动端体验',
      '建议增加客服在线功能'
    ]
    const contents = [
      '应用在使用过程中经常出现卡顿现象，特别是在进行检测操作时，希望能优化应用性能，提升用户体验。',
      '建议在应用中增加夜间模式功能，这样在光线较暗的环境下使用会更加舒适。',
      '目前只支持指纹检测，希望能增加掌纹、人脸、虹膜等其他检测部位，提供更全面的生物识别服务。',
      '生成检测报告的速度比较慢，有时候需要等待很长时间，希望能优化报告生成算法。',
      '整体界面设计还可以更美观一些，建议采用更现代的设计风格，提升视觉效果。',
      '希望能支持批量导出功能，这样可以一次性导出多个检测报告，提高工作效率。',
      '检测精度还有提升空间，希望能优化算法，提高检测的准确性和可靠性。',
      '用户界面操作不够直观，新手用户可能需要较长时间才能熟悉操作流程。',
      '希望能增加数据备份功能，防止重要数据丢失，提供数据安全保障。',
      '建议增加详细的使用教程，帮助用户更好地使用各项功能。',
      '登录时验证码显示异常，有时候看不清验证码内容，影响登录体验。',
      '希望增加数据统计功能，可以查看使用情况和检测结果统计。',
      '检测结果有时保存失败，需要重新进行检测，浪费时间和精力。',
      '移动端体验需要优化，在手机上使用时界面布局不够合理。',
      '建议增加客服在线功能，当用户遇到问题时可以及时获得帮助。'
    ]
    const replies = [
      '感谢您的反馈，我们正在优化应用性能，预计在下个版本中会有明显改善。',
      '您的建议很好，我们会在下个版本中考虑添加夜间模式功能。',
      '我们会认真考虑您的建议，逐步增加更多检测部位的支持。',
      '感谢您的耐心等待，我们正在优化报告生成算法，提升生成速度。',
      '我们会持续改进界面设计，采用更现代的设计风格。',
      '批量导出功能已经在开发计划中，我们会尽快实现这个功能。',
      '我们会继续优化检测算法，提高检测精度和可靠性。',
      '我们会重新设计用户界面，让操作更加直观和便捷。',
      '数据备份功能很重要，我们会尽快实现这个功能。',
      '我们会制作详细的使用教程，帮助用户更好地使用应用。',
      '我们会修复验证码显示问题，确保验证码清晰可见。',
      '数据统计功能已经在开发中，我们会尽快上线。',
      '我们会修复数据保存问题，确保检测结果能够正常保存。',
      '我们会优化移动端界面，提供更好的移动端体验。',
      '我们会考虑增加客服功能，为用户提供更好的服务支持。'
    ]
    
    // 创建50个反馈记录
    for (let i = 1; i <= 50; i++) {
      const user = users[i % users.length]
      const type = feedbackTypes[i % feedbackTypes.length]
      const status = feedbackStatuses[i % feedbackStatuses.length]
      const title = titles[i % titles.length]
      const content = contents[i % contents.length]
      const reply = status === 'resolved' || status === 'rejected' ? replies[i % replies.length] : null
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机30天内的时间
      const repliedAt = reply ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null // 回复时间在创建时间后1-7天
      
      // 创建反馈记录
      const feedback = await prisma.feedback.create({
        data: {
          userId: user.id,
          type,
          title,
          content,
          images: [],
          status,
          reply,
          repliedAt
        }
      })

      console.log(`已创建反馈 ${title}`)
    }
    
    console.log('反馈模拟数据创建完成！')
  } catch (error) {
    console.error('创建反馈数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedFeedbacks()
}

module.exports = { seedFeedbacks } 