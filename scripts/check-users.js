const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 检查数据库中的用户数据...')
    
    // 检查微信用户
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true
      }
    })
    
    console.log(`📊 微信用户数量: ${wechatUsers.length}`)
    
    wechatUsers.forEach((user, index) => {
      console.log(`\n👤 微信用户 ${index + 1}:`)
      console.log(`  - ID: ${user.id}`)
      console.log(`  - OpenID: ${user.openid}`)
      console.log(`  - 昵称: ${user.nickname || '未设置'}`)
      console.log(`  - 状态: ${user.status}`)
      console.log(`  - 子用户数量: ${user.subUsers.length}`)
      
      if (user.subUsers.length > 0) {
        console.log(`  - 子用户列表:`)
        user.subUsers.forEach((subUser, subIndex) => {
          console.log(`    ${subIndex + 1}. ${subUser.realName || '未设置姓名'} (${subUser.username || '未设置用户名'})`)
          console.log(`       状态: ${subUser.status}`)
          console.log(`       档案数: ${subUser.archives}`)
          console.log(`       报告数: ${subUser.reports}`)
        })
      }
    })
    
    // 检查子用户
    const subUsers = await prisma.subUser.findMany({
      include: {
        wechatUser: true
      }
    })
    
    console.log(`\n📊 子用户总数: ${subUsers.length}`)
    
    // 检查检测记录
    const detections = await prisma.detection.findMany({
      include: {
        subUser: {
          include: {
            wechatUser: true
          }
        }
      }
    })
    
    console.log(`📊 检测记录总数: ${detections.length}`)
    
    if (detections.length > 0) {
      console.log(`\n🔍 最新检测记录:`)
      detections.slice(0, 3).forEach((detection, index) => {
        console.log(`  ${index + 1}. ${detection.archiveName}`)
        console.log(`     子用户: ${detection.subUser.realName || detection.subUser.username}`)
        console.log(`     微信用户: ${detection.subUser.wechatUser.nickname}`)
        console.log(`     结果: ${detection.result}`)
        console.log(`     状态: ${detection.status}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  }) 