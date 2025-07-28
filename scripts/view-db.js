const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function viewDatabase() {
  try {
    console.log('🔍 正在连接数据库...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功！\n')
    
    // 查看所有表
    console.log('📋 数据库表列表:')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log('❌ 没有找到任何表，数据库可能是空的')
      console.log('💡 请先运行: npm run db:migrate')
      return
    }
    
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })
    
    console.log('\n📊 各表数据统计:')
    
    // 统计各表记录数
    const tableStats = await Promise.all([
      prisma.user.count().then(count => ({ table: 'users', count })),
      prisma.admin.count().then(count => ({ table: 'admins', count })),
      prisma.detection.count().then(count => ({ table: 'detections', count })),
      prisma.banner.count().then(count => ({ table: 'banners', count })),
      prisma.news.count().then(count => ({ table: 'news', count })),
      prisma.feedback.count().then(count => ({ table: 'feedbacks', count })),
      prisma.coupon.count().then(count => ({ table: 'coupons', count })),
      prisma.systemConfig.count().then(count => ({ table: 'system_configs', count })),
      prisma.operationLog.count().then(count => ({ table: 'operation_logs', count }))
    ])
    
    tableStats.forEach(stat => {
      console.log(`  - ${stat.table}: ${stat.count} 条记录`)
    })
    
    // 显示最新数据
    console.log('\n🆕 最新数据预览:')
    
    // 最新用户
    const latestUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, nickname: true, createdAt: true }
    })
    
    if (latestUsers.length > 0) {
      console.log('\n👥 最新用户:')
      latestUsers.forEach(user => {
        console.log(`  - ${user.nickname || '未设置昵称'} (${user.id}) - ${user.createdAt.toLocaleString()}`)
      })
    }
    
    // 最新检测记录
    const latestDetections = await prisma.detection.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, createdAt: true }
    })
    
    if (latestDetections.length > 0) {
      console.log('\n🔍 最新检测记录:')
      latestDetections.forEach(detection => {
        console.log(`  - ${detection.status} (${detection.id}) - ${detection.createdAt.toLocaleString()}`)
      })
    }
    
    // 最新反馈
    const latestFeedbacks = await prisma.feedback.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, title: true, createdAt: true }
    })
    
    if (latestFeedbacks.length > 0) {
      console.log('\n💬 最新反馈:')
      latestFeedbacks.forEach(feedback => {
        console.log(`  - ${feedback.type}: ${feedback.title} (${feedback.id}) - ${feedback.createdAt.toLocaleString()}`)
      })
    }
    
    console.log('\n✨ 数据库查看完成！')
    
  } catch (error) {
    console.error('❌ 数据库查看失败:', error.message)
    
    if (error.code === 'P1001') {
      console.log('\n💡 可能的解决方案:')
      console.log('1. 检查数据库服务是否启动')
      console.log('2. 检查 DATABASE_URL 配置是否正确')
      console.log('3. 如果是本地数据库，请启动 PostgreSQL 服务')
      console.log('4. 如果是云数据库，请检查网络连接')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  viewDatabase()
}

module.exports = { viewDatabase } 