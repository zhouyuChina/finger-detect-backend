const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedArchives() {
  try {
    console.log('开始创建档案模拟数据...')
    
    const userIds = ['ID001', 'ID002', 'ID003', 'ID004', 'ID005', 'ID006', 'ID007', 'ID008', 'ID009', 'ID010']
    const nicknames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
    const archiveNames = [
      '指纹档案A',
      '生物识别档案B',
      '身份认证档案C',
      '安全检测档案D',
      '个人档案E',
      '企业档案F',
      'VIP档案G',
      '测试档案H',
      '演示档案I',
      '临时档案J'
    ]
    const activities = ['high', 'medium', 'low', 'inactive']
    const bodyParts = ['finger', 'palm', 'face', 'iris', 'voice']
    
    // 创建50个档案记录
    for (let i = 1; i <= 50; i++) {
      const userId = userIds[i % userIds.length]
      const userNickname = `${nicknames[i % nicknames.length]}${i}`
      const archiveName = `${archiveNames[i % archiveNames.length]}${i}`
      const activity = activities[i % activities.length]
      const photoCount = ((i * 7) % 100) + 1
      const bodyPart = bodyParts[i % bodyParts.length]
      const detectionTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机30天内的时间
      
      // 创建档案记录
      const archive = await prisma.archive.create({
        data: {
          userId,
          userNickname,
          archiveName,
          activity,
          photoCount,
          bodyPart,
          detectionTime
        }
      })

      console.log(`已创建档案 ${archiveName}`)
    }
    
    console.log('档案模拟数据创建完成！')
  } catch (error) {
    console.error('创建档案数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedArchives()
}

module.exports = { seedArchives } 