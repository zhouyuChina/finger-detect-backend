const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedDetections() {
  try {
    console.log('开始创建检测记录模拟数据...')
    
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
    const bodyParts = ['finger', 'palm', 'face', 'iris', 'voice']
    const statuses = ['pending', 'processing', 'completed', 'failed']
    
    // 创建60个检测记录
    for (let i = 1; i <= 60; i++) {
      const userId = userIds[i % userIds.length]
      const userNickname = `${nicknames[i % nicknames.length]}${i}`
      const archiveName = `${archiveNames[i % archiveNames.length]}${i}`
      const bodyPart = bodyParts[i % bodyParts.length]
      const status = statuses[i % statuses.length]
      const confidence = Math.random() * 100
      const detectionTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机30天内的时间
      
      // 创建检测记录
      const detection = await prisma.detection.create({
        data: {
          userId,
          userNickname,
          archiveName,
          bodyPart,
          imageUrl: `/uploads/detection_${i}.jpg`,
          result: JSON.stringify({ score: confidence, details: `检测结果详情${i}` }),
          confidence,
          status,
          detectionTime
        }
      })

      console.log(`已创建检测记录 ${archiveName}`)
    }
    
    console.log('检测记录模拟数据创建完成！')
  } catch (error) {
    console.error('创建检测记录数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedDetections()
}

module.exports = { seedDetections } 