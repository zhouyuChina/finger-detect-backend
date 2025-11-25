import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查 SubUser 表数据...\n')

  // 统计总数
  const totalCount = await prisma.subUser.count()
  console.log(`📊 SubUser 总数: ${totalCount}\n`)

  if (totalCount === 0) {
    console.log('⚠️  数据库中没有 SubUser 数据')
    return
  }

  // 性别分布
  console.log('👥 性别分布:')
  const genderStats = await prisma.subUser.groupBy({
    by: ['gender'],
    _count: {
      gender: true
    }
  })

  genderStats.forEach(item => {
    console.log(`  性别值: "${item.gender}" (类型: ${typeof item.gender}) - 数量: ${item._count.gender}`)
  })

  // 年龄统计
  console.log('\n📅 年龄统计:')
  const users = await prisma.subUser.findMany({
    select: { age: true }
  })

  const ageGroups = {
    '有年龄': 0,
    '无年龄': 0
  }

  users.forEach(user => {
    if (user.age) {
      ageGroups['有年龄']++
    } else {
      ageGroups['无年龄']++
    }
  })

  console.log(`  有年龄数据: ${ageGroups['有年龄']}`)
  console.log(`  无年龄数据: ${ageGroups['无年龄']}`)

  // 显示前10条示例
  console.log('\n📋 前10条记录示例:')
  const samples = await prisma.subUser.findMany({
    take: 10,
    select: {
      id: true,
      realName: true,
      gender: true,
      age: true
    }
  })

  if (samples.length > 0) {
    samples.forEach((user, index) => {
      console.log(`  ${index + 1}. 姓名: ${user.realName || '未设置'} | 性别: "${user.gender}" | 年龄: ${user.age || '未设置'}`)
    })
  } else {
    console.log('  没有数据')
  }
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
