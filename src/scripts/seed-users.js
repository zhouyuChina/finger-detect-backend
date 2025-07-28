const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedUsers() {
  try {
    console.log('开始创建用户模拟数据...')

    const users = [
      {
        openid: 'openid_001',
        unionid: 'unionid_001',
        nickname: '张三1',
        avatar: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=张',
        phone: '13800138001',
        gender: 1,
        city: '北京',
        province: '北京',
        country: '中国'
      },
      {
        openid: 'openid_002',
        unionid: 'unionid_002',
        nickname: '李四2',
        avatar: 'https://via.placeholder.com/100x100/DC2626/FFFFFF?text=李',
        phone: '13800138002',
        gender: 2,
        city: '上海',
        province: '上海',
        country: '中国'
      },
      {
        openid: 'openid_003',
        unionid: 'unionid_003',
        nickname: '王五3',
        avatar: 'https://via.placeholder.com/100x100/059669/FFFFFF?text=王',
        phone: '13800138003',
        gender: 1,
        city: '广州',
        province: '广东',
        country: '中国'
      },
      {
        openid: 'openid_004',
        unionid: 'unionid_004',
        nickname: '赵六4',
        avatar: 'https://via.placeholder.com/100x100/D97706/FFFFFF?text=赵',
        phone: '13800138004',
        gender: 2,
        city: '深圳',
        province: '广东',
        country: '中国'
      },
      {
        openid: 'openid_005',
        unionid: 'unionid_005',
        nickname: '钱七5',
        avatar: 'https://via.placeholder.com/100x100/7C3AED/FFFFFF?text=钱',
        phone: '13800138005',
        gender: 1,
        city: '杭州',
        province: '浙江',
        country: '中国'
      }
    ]

    for (const userData of users) {
      // 检查是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { openid: userData.openid }
      })

      if (existingUser) {
        console.log(`用户 ${userData.nickname} 已存在，跳过`)
        continue
      }

      await prisma.user.create({
        data: userData
      })

      console.log(`已创建用户 ${userData.nickname}`)
    }

    console.log('用户模拟数据创建完成！')
  } catch (error) {
    console.error('创建用户模拟数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedUsers()
}

module.exports = { seedUsers } 