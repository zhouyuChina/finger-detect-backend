const { PrismaClient } = require('../src/generated/prisma/index.js')

async function fixRemoteDatabase() {
  console.log('🔧 修复远程数据库...\n')
  
  // 注意：这里需要连接到远程数据库
  // 需要确保环境变量指向远程数据库
  const prisma = new PrismaClient()
  
  try {
    console.log('📊 检查远程数据库状态...')
    
    // 尝试连接数据库
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 检查表是否存在
    try {
      const wechatUsers = await prisma.wechatUser.findMany()
      console.log('✅ wechat_users表存在，记录数:', wechatUsers.length)
    } catch (error) {
      console.log('❌ wechat_users表不存在:', error.message)
      console.log('需要执行数据库迁移...')
    }
    
    // 检查其他关键表
    const tables = ['subUser', 'detection', 'archive']
    for (const table of tables) {
      try {
        const result = await prisma[table].findMany()
        console.log(`✅ ${table}表存在，记录数:`, result.length)
      } catch (error) {
        console.log(`❌ ${table}表不存在:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.log('\n💡 解决方案:')
    console.log('1. 确保远程服务器环境变量正确')
    console.log('2. 在远程服务器上执行: npx prisma migrate deploy')
    console.log('3. 或者执行: npx prisma db push --force-reset')
  } finally {
    await prisma.$disconnect()
  }
}

fixRemoteDatabase() 