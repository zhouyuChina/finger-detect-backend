const { PrismaClient } = require('../src/generated/prisma/index.js')

async function checkDatabaseTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查数据库表结构...\n')
    
    // 检查wechat_users表
    try {
      const wechatUsers = await prisma.wechatUser.findMany()
      console.log('✅ wechat_users表存在，记录数:', wechatUsers.length)
    } catch (error) {
      console.log('❌ wechat_users表不存在或有问题:', error.message)
    }
    
    // 检查sub_users表
    try {
      const subUsers = await prisma.subUser.findMany()
      console.log('✅ sub_users表存在，记录数:', subUsers.length)
    } catch (error) {
      console.log('❌ sub_users表不存在或有问题:', error.message)
    }
    
    // 检查detections表
    try {
      const detections = await prisma.detection.findMany()
      console.log('✅ detections表存在，记录数:', detections.length)
    } catch (error) {
      console.log('❌ detections表不存在或有问题:', error.message)
    }
    
    // 检查archives表
    try {
      const archives = await prisma.archive.findMany()
      console.log('✅ archives表存在，记录数:', archives.length)
    } catch (error) {
      console.log('❌ archives表不存在或有问题:', error.message)
    }
    
    // 检查其他表
    const tables = ['admin', 'banner', 'news', 'feedback', 'systemReply', 'coupon', 'userCoupon', 'company', 'systemConfig', 'operationLog', 'userReadStatus']
    
    for (const table of tables) {
      try {
        const result = await prisma[table].findMany()
        console.log(`✅ ${table}表存在，记录数:`, result.length)
      } catch (error) {
        console.log(`❌ ${table}表不存在或有问题:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseTables() 