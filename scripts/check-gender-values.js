import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查数据库中的性别字段值...\n')

  // 获取所有不同的性别值
  const genderStats = await prisma.wechatUserVerification.groupBy({
    by: ['gender'],
    _count: {
      gender: true
    }
  })

  console.log('数据库中的性别值分布:')
  genderStats.forEach(item => {
    console.log(`  值: "${item.gender}" (类型: ${typeof item.gender}) - 数量: ${item._count.gender}`)
  })

  console.log('\n前10条记录示例:')
  const samples = await prisma.wechatUserVerification.findMany({
    take: 10,
    select: {
      id: true,
      realName: true,
      gender: true,
      age: true
    }
  })

  samples.forEach(user => {
    console.log(`  ID: ${user.id.substring(0, 8)}... | 姓名: ${user.realName} | 性别: "${user.gender}" | 年龄: ${user.age}`)
  })
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
