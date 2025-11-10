/**
 * 修复 Archive-Detection 关联关系
 *
 * 问题：Detection 表通过 archiveName 关联 Archive，导致修改档案名后检测记录丢失关联
 * 解决：为所有 Detection 记录填充正确的 archiveId
 *
 * 使用方法：
 *   node scripts/fix-archive-relations.js [--dry-run] [--verbose]
 *
 * 参数：
 *   --dry-run: 只检查不修改数据
 *   --verbose: 显示详细日志
 */

import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

// 解析命令行参数
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isVerbose = args.includes('--verbose')

/**
 * 主函数
 */
async function fixArchiveRelations() {
  console.log('========================================')
  console.log('Archive-Detection 关联关系修复脚本')
  console.log('========================================\n')

  if (isDryRun) {
    console.log('🔍 运行模式：DRY RUN（只检查，不修改数据）\n')
  } else {
    console.log('⚠️  运行模式：实际修改数据\n')
  }

  try {
    // 步骤 1：统计总体情况
    await step1_statistics()

    // 步骤 2：检查需要修复的记录
    const detections = await step2_findDetectionsNeedFix()

    if (detections.length === 0) {
      console.log('\n✅ 所有检测记录都已正确关联档案，无需修复！')
      return
    }

    // 步骤 3：修复记录
    if (!isDryRun) {
      await step3_fixDetections(detections)
    }

    // 步骤 4：验证修复结果
    await step4_verify()

  } catch (error) {
    console.error('\n❌ 修复过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 步骤 1：统计总体情况
 */
async function step1_statistics() {
  console.log('📊 步骤 1：统计数据...\n')

  const [
    totalDetections,
    totalArchives,
    detectionsWithArchiveId,
    detectionsWithoutArchiveId
  ] = await Promise.all([
    prisma.detection.count(),
    prisma.archive.count(),
    prisma.detection.count({ where: { archiveId: { not: null } } }),
    prisma.detection.count({ where: { archiveId: null } })
  ])

  console.log(`总档案数：${totalArchives}`)
  console.log(`总检测记录数：${totalDetections}`)
  console.log(`  - 已有 archiveId：${detectionsWithArchiveId}`)
  console.log(`  - 缺少 archiveId：${detectionsWithoutArchiveId}`)

  if (detectionsWithoutArchiveId > 0) {
    const percentage = ((detectionsWithoutArchiveId / totalDetections) * 100).toFixed(2)
    console.log(`  - 需要修复比例：${percentage}%`)
  }

  console.log('')
}

/**
 * 步骤 2：查找需要修复的记录
 */
async function step2_findDetectionsNeedFix() {
  console.log('🔍 步骤 2：查找需要修复的记录...\n')

  const detections = await prisma.detection.findMany({
    where: {
      OR: [
        { archiveId: null },
        { archiveId: '' }
      ]
    },
    select: {
      id: true,
      archiveName: true,
      subUserId: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`发现 ${detections.length} 条检测记录需要修复`)

  if (isVerbose && detections.length > 0) {
    console.log('\n前 10 条需要修复的记录：')
    detections.slice(0, 10).forEach((d, index) => {
      console.log(`  ${index + 1}. ID: ${d.id}`)
      console.log(`     档案名: ${d.archiveName}`)
      console.log(`     子用户: ${d.subUserId}`)
      console.log(`     创建时间: ${d.createdAt.toISOString()}`)
    })
    if (detections.length > 10) {
      console.log(`  ... 还有 ${detections.length - 10} 条记录`)
    }
  }

  console.log('')
  return detections
}

/**
 * 步骤 3：修复检测记录
 */
async function step3_fixDetections(detections) {
  console.log('🔧 步骤 3：开始修复检测记录...\n')

  let successCount = 0
  let failCount = 0
  const failedRecords = []
  const batchSize = 100
  let processedCount = 0

  for (const detection of detections) {
    try {
      // 查找对应的档案
      const archive = await prisma.archive.findFirst({
        where: {
          archiveName: detection.archiveName,
          subUserId: detection.subUserId
        },
        select: {
          id: true,
          archiveName: true
        }
      })

      if (archive) {
        // 更新检测记录的 archiveId
        await prisma.detection.update({
          where: { id: detection.id },
          data: { archiveId: archive.id }
        })

        successCount++

        if (isVerbose) {
          console.log(`  ✅ 修复成功: ${detection.id} -> ${archive.id}`)
        }
      } else {
        // 找不到对应的档案
        failCount++
        failedRecords.push({
          detectionId: detection.id,
          archiveName: detection.archiveName,
          subUserId: detection.subUserId,
          reason: '找不到对应的档案'
        })

        if (isVerbose) {
          console.log(`  ❌ 修复失败: ${detection.id} - 找不到档案 "${detection.archiveName}"`)
        }
      }

      processedCount++

      // 每处理一批，显示进度
      if (processedCount % batchSize === 0) {
        const progress = ((processedCount / detections.length) * 100).toFixed(1)
        console.log(`  进度: ${processedCount}/${detections.length} (${progress}%)`)
      }

    } catch (error) {
      failCount++
      failedRecords.push({
        detectionId: detection.id,
        archiveName: detection.archiveName,
        subUserId: detection.subUserId,
        error: error.message
      })

      console.error(`  ❌ 修复记录 ${detection.id} 时出错:`, error.message)
    }
  }

  // 输出修复结果
  console.log('\n修复完成！')
  console.log(`✅ 成功: ${successCount} 条`)
  console.log(`❌ 失败: ${failCount} 条`)

  // 如果有失败记录，保存到文件
  if (failedRecords.length > 0) {
    console.log('\n失败的记录：')

    if (isVerbose) {
      console.log(JSON.stringify(failedRecords, null, 2))
    } else {
      failedRecords.slice(0, 5).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.detectionId} - ${record.reason || record.error}`)
      })
      if (failedRecords.length > 5) {
        console.log(`  ... 还有 ${failedRecords.length - 5} 条失败记录`)
      }
    }

    // 保存失败记录到文件
    const fs = await import('fs/promises')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `failed_detections_${timestamp}.json`

    await fs.writeFile(
      filename,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalFailed: failedRecords.length,
        records: failedRecords
      }, null, 2)
    )

    console.log(`\n失败记录已保存到: ${filename}`)
  }

  console.log('')
}

/**
 * 步骤 4：验证修复结果
 */
async function step4_verify() {
  console.log('✔️  步骤 4：验证修复结果...\n')

  const [
    totalDetections,
    detectionsWithArchiveId,
    detectionsWithoutArchiveId
  ] = await Promise.all([
    prisma.detection.count(),
    prisma.detection.count({ where: { archiveId: { not: null } } }),
    prisma.detection.count({ where: { archiveId: null } })
  ])

  console.log(`总检测记录数：${totalDetections}`)
  console.log(`  - 已有 archiveId：${detectionsWithArchiveId}`)
  console.log(`  - 缺少 archiveId：${detectionsWithoutArchiveId}`)

  if (detectionsWithoutArchiveId === 0) {
    console.log('\n✅ 验证通过：所有检测记录都已正确关联档案！')
  } else {
    const percentage = ((detectionsWithoutArchiveId / totalDetections) * 100).toFixed(2)
    console.log(`\n⚠️  仍有 ${detectionsWithoutArchiveId} 条记录（${percentage}%）缺少 archiveId`)
    console.log('这些记录可能对应的档案已被删除，需要手动处理。')
  }

  // 检查数据一致性
  console.log('\n🔍 检查数据一致性...')

  const inconsistentDetections = await prisma.$queryRaw`
    SELECT
      d.id,
      d."archiveName" as detection_archive_name,
      d."archiveId" as detection_archive_id,
      a."archiveName" as archive_archive_name,
      a.id as archive_id
    FROM detections d
    LEFT JOIN archives a ON d."archiveId" = a.id
    WHERE d."archiveId" IS NOT NULL
      AND (
        a.id IS NULL
        OR d."archiveName" != a."archiveName"
      )
    LIMIT 10
  `

  if (inconsistentDetections.length > 0) {
    console.log(`\n⚠️  发现 ${inconsistentDetections.length} 条数据不一致：`)
    if (isVerbose) {
      console.log(JSON.stringify(inconsistentDetections, null, 2))
    } else {
      console.log('运行脚本时添加 --verbose 参数查看详情')
    }
  } else {
    console.log('✅ 数据一致性检查通过！')
  }

  console.log('')
}

/**
 * 运行脚本
 */
console.log('\n')
fixArchiveRelations()
  .then(() => {
    console.log('========================================')
    console.log('✅ 修复脚本执行完成')
    console.log('========================================\n')
    process.exit(0)
  })
  .catch((error) => {
    console.log('========================================')
    console.error('❌ 修复脚本执行失败:', error)
    console.log('========================================\n')
    process.exit(1)
  })
