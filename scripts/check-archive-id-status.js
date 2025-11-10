/**
 * 检查 Detection 表中 archiveId 的填充情况
 */

import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkArchiveIdStatus() {
  console.log('📊 检查 Detection 表中 archiveId 的填充情况...\n')

  try {
    // 统计总体情况
    const totalDetections = await prisma.detection.count()
    const withArchiveId = await prisma.detection.count({
      where: { archiveId: { not: null } }
    })
    const withoutArchiveId = await prisma.detection.count({
      where: { archiveId: null }
    })

    console.log('总检测记录数:', totalDetections)
    console.log('已有 archiveId:', withArchiveId)
    console.log('缺少 archiveId:', withoutArchiveId)

    if (totalDetections > 0) {
      const coverage = ((withArchiveId / totalDetections) * 100).toFixed(2)
      console.log(`覆盖率: ${coverage}%\n`)
    }

    // 如果覆盖率很高，显示好消息
    if (withArchiveId === totalDetections) {
      console.log('✅ 太棒了！所有检测记录都已有 archiveId！')
      console.log('这意味着我们可以跳过数据修复步骤，直接修改代码和 Schema！\n')
    } else if (withArchiveId > totalDetections * 0.8) {
      console.log('✅ 大部分记录都有 archiveId，只需要修复少量数据\n')
    }

    // 检查 archiveId 是否都是有效的
    if (withArchiveId > 0) {
      console.log('🔍 检查 archiveId 的有效性...')

      const invalidArchiveIds = await prisma.$queryRaw`
        SELECT
          d.id as detection_id,
          d."archiveId",
          d."archiveName"
        FROM detections d
        LEFT JOIN archives a ON d."archiveId" = a.id
        WHERE d."archiveId" IS NOT NULL
          AND a.id IS NULL
        LIMIT 10
      `

      if (invalidArchiveIds.length > 0) {
        console.log(`⚠️  发现 ${invalidArchiveIds.length} 条记录的 archiveId 无效（对应的档案不存在）`)
        console.log('示例:', invalidArchiveIds.slice(0, 3))
      } else {
        console.log('✅ 所有 archiveId 都是有效的！')
      }
    }

    // 显示一些样本数据
    console.log('\n📋 样本数据（最近 5 条）:')
    const samples = await prisma.detection.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        archiveId: true,
        archiveName: true,
        subUserId: true,
        createdAt: true
      }
    })

    samples.forEach((s, i) => {
      console.log(`\n${i + 1}.`)
      console.log(`   ID: ${s.id}`)
      console.log(`   archiveId: ${s.archiveId || '(null)'}`)
      console.log(`   archiveName: ${s.archiveName}`)
      console.log(`   subUserId: ${s.subUserId}`)
    })

  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkArchiveIdStatus()
