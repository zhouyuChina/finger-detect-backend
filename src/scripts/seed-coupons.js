const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedCoupons() {
  try {
    console.log('开始创建优惠券模拟数据...')
    
    const types = ['discount', 'free']
    const channels = ['all', 'wechat', 'app', 'website', 'offline', 'partner']
    const targetUsers = ['all', 'vip', 'enterprise', 'normal', 'new']
    const statuses = ['pending', 'active', 'expired', 'paused', 'cancelled']
    const names = [
      '新用户专享券',
      'VIP会员优惠券',
      '春节特惠券',
      '满减优惠券',
      '折扣优惠券',
      '生日特惠券',
      '节日优惠券',
      '推荐好友券',
      '复购优惠券',
      '限时特惠券',
      '企业专享券',
      '合作伙伴券',
      'APP专享券',
      '微信小程序券',
      '官网专享券'
    ]
    const descriptions = [
      '新用户注册即可领取，享受首次购买优惠',
      'VIP会员专享优惠，享受更多折扣',
      '春节特别优惠活动，限时抢购',
      '满额即可享受优惠，多买多省',
      '全场商品享受折扣优惠',
      '生日当月专享优惠券',
      '节日特别优惠活动',
      '推荐好友注册即可获得优惠券',
      '复购用户专享优惠',
      '限时特惠活动，先到先得',
      '企业用户专享优惠券',
      '合作伙伴专享优惠',
      'APP用户专享优惠券',
      '微信小程序用户专享优惠',
      '官网用户专享优惠券'
    ]
    
    // 生成优惠券代码
    const generateCode = (index) => {
      const prefix = ['VIP', 'NEW', 'SPR', 'SUM', 'AUT', 'WIN'][index % 6]
      const suffix = String(index).padStart(4, '0')
      return `${prefix}${suffix}`
    }
    
    // 创建50个优惠券记录
    for (let i = 1; i <= 50; i++) {
      const type = types[i % types.length]
      const channel = channels[i % channels.length]
      const targetUser = targetUsers[i % targetUsers.length]
      const status = statuses[i % statuses.length]
      const name = `${names[i % names.length]}${i}`
      const description = descriptions[i % descriptions.length]
      const code = generateCode(i)
      const value = type === 'discount' ? Math.floor(Math.random() * 50) + 10 : 0 // 折扣券10-60元，免费券0元
      const minAmount = type === 'discount' ? Math.floor(Math.random() * 100) + 50 : 0 // 最低消费50-150元
      const maxDiscount = type === 'discount' ? Math.floor(Math.random() * 100) + 50 : 0 // 最大优惠50-150元
      const totalCount = Math.floor(Math.random() * 1000) + 100 // 总数量100-1100
      const usedCount = Math.floor(Math.random() * totalCount * 0.8) // 已使用数量不超过总数的80%
      
      // 生成随机时间（最近30天内开始，未来30天内结束）
      const now = new Date()
      const startDays = Math.floor(Math.random() * 30)
      const durationDays = Math.floor(Math.random() * 60) + 7
      const startTime = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000)
      
      // 创建优惠券记录
      const coupon = await prisma.coupon.create({
        data: {
          name,
          code,
          type,
          value,
          minAmount,
          maxDiscount,
          totalCount,
          usedCount,
          startTime,
          endTime,
          channel,
          targetUsers: targetUser,
          status,
          description,
          isActive: status !== 'cancelled'
        }
      })

      console.log(`已创建优惠券 ${name} (${code})`)
    }
    
    console.log('优惠券模拟数据创建完成！')
  } catch (error) {
    console.error('创建优惠券数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedCoupons()
}

module.exports = { seedCoupons } 