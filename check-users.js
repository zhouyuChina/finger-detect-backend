import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.wechatUser.findMany({
      include: {
        verification: true,
        subUsers: true
      }
    })

    console.log(`\n📊 数据库中还有 ${users.length} 个微信用户\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nickname || user.openid}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   验证记录: ${user.verification ? '有' : '无'}`)
      console.log(`   子用户数: ${user.subUsers?.length || 0}\n`)
    })

  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
