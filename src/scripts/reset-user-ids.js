const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function resetUserIds() {
  try {
    console.log('删除现有的ID管理数据...')
    
    await prisma.userId.deleteMany({})
    
    console.log('ID管理数据已清空')
  } catch (error) {
    console.error('删除数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetUserIds()
}

module.exports = { resetUserIds } 