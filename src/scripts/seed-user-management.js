const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedUserManagement() {
  try {
    console.log('开始创建用户管理模拟数据...')
    
    const names = ['小明', '小红', '小李', '小王', '小张', '小赵', '小钱', '小孙', '小周', '小吴']
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆']
    const statuses = ['active', 'inactive', 'pending', 'banned']
    const genders = ['男', '女']
    
    // 创建50个用户
    for (let i = 1; i <= 50; i++) {
      const username = `${names[i % names.length]}${i}`
      const realName = `${names[i % names.length]}${i}`
      const phone = `13800138${String(i).padStart(3, '0')}`
      const email = `user${i}@example.com`
      const age = 20 + (i % 50)
      const gender = genders[i % genders.length]
      const city = `${cities[i % cities.length]}市`
      const address = `${cities[i % cities.length]}市某区某街道${i}号`
      const status = statuses[i % statuses.length]
      const userId = `ID${String(i).padStart(3, '0')}`
      const archives = (i * 5) % 20
      const photos = (i * 7) % 50
      const reports = (i * 11) % 15
      const remark = i % 3 === 0 ? `用户备注信息${i}` : null
      
      // 检查用户是否已存在
      const existingUser = await prisma.user.findFirst({
        where: { username }
      })

      if (existingUser) {
        console.log(`用户 ${username} 已存在，跳过`)
        continue
      }

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username,
          nickname: username,
          realName,
          phone,
          email,
          age,
          gender,
          city,
          address,
          status,
          userId,
          archives,
          photos,
          reports,
          remark,
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机30天内的时间
        }
      })

      console.log(`已创建用户 ${username}`)
    }
    
    console.log('用户管理模拟数据创建完成！')
  } catch (error) {
    console.error('创建用户管理数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedUserManagement()
}

module.exports = { seedUserManagement } 