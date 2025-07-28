const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function checkUserIds() {
  try {
    console.log('检查数据库中的ID管理数据...\n')

    // 检查用户数据
    const users = await prisma.user.findMany()
    console.log(`用户表数据: ${users.length} 条记录`)
    users.forEach(user => {
      console.log(`- ${user.nickname} (ID: ${user.id})`)
    })

    console.log('\n' + '='.repeat(50) + '\n')

    // 检查ID管理数据
    const userIds = await prisma.userId.findMany({
      include: {
        user: {
          select: {
            nickname: true,
            avatar: true
          }
        }
      }
    })

    console.log(`ID管理表数据: ${userIds.length} 条记录`)
    userIds.forEach(userId => {
      console.log(`- 用户: ${userId.user?.nickname || '未知'}`)
      console.log(`  真实姓名: ${userId.realName}`)
      console.log(`  身份证号: ${userId.idNumber}`)
      console.log(`  认证状态: ${userId.verifyStatus}`)
      console.log(`  创建时间: ${userId.createdAt}`)
      console.log('')
    })

    if (userIds.length === 0) {
      console.log('⚠️  没有找到ID管理数据，需要运行种子脚本')
      console.log('运行命令: node src/scripts/seed-user-ids.js')
    }

  } catch (error) {
    console.error('检查数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkUserIds()
}

module.exports = { checkUserIds } 