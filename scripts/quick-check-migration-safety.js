/**
 * 快速检查：线上数据是否可以安全应用方案B
 *
 * 用法：node scripts/quick-check-migration-safety.js
 */

import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function quickCheck() {
  console.log('🔍 检查线上数据是否可以安全迁移...\n')

  try {
    // 检查1：是否有 NULL 的 archiveId
    const nullCount = await prisma.detection.count({
      where: { archiveId: null }
    })

    console.log('检查1：archiveId 为 NULL 的记录数')
    console.log(`结果: ${nullCount} 条`)

    if (nullCount === 0) {
      console.log('✅ 通过：没有 NULL 值\n')
    } else {
      console.log(`❌ 失败：有 ${nullCount} 条记录需要修复\n`)
      console.log('解决方案：运行 node scripts/fix-archive-relations.js\n')
      await prisma.$disconnect()
      process.exit(1)
    }

    // 检查2：是否有孤立的 archiveId（指向不存在的档案）
    const orphanRecords = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM detections d
      LEFT JOIN archives a ON d."archiveId" = a.id
      WHERE d."archiveId" IS NOT NULL AND a.id IS NULL
    `

    const orphanCount = Number(orphanRecords[0]?.count || 0)

    console.log('检查2：archiveId 指向不存在档案的记录数')
    console.log(`结果: ${orphanCount} 条`)

    if (orphanCount === 0) {
      console.log('✅ 通过：所有 archiveId 都有效\n')
    } else {
      console.log(`❌ 失败：有 ${orphanCount} 条孤立记录\n`)
      console.log('解决方案：删除这些孤立记录或修复数据\n')
      await prisma.$disconnect()
      process.exit(1)
    }

    // 汇总
    console.log('=' .repeat(50))
    console.log('✅✅✅ 所有检查通过！')
    console.log('=' .repeat(50))
    console.log('\n可以安全应用方案B，迁移不会影响任何数据！\n')
    console.log('下一步：')
    console.log('1. 修改 Schema')
    console.log('2. 运行: npx prisma migrate dev --name add_archive_relation')
    console.log('3. 修改代码')
    console.log('4. 部署\n')

  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

quickCheck()
