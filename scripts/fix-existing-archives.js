const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function fixExistingArchives() {
  try {
    console.log('🔧 开始修复现有档案的 photoCount...')

    // 1. 获取所有档案
    const archives = await prisma.archive.findMany({
      select: {
        id: true,
        subUserId: true,
        archiveName: true,
        photoCount: true,
        bodyPart: true,
        createdAt: true
      }
    })

    console.log(`📊 找到 ${archives.length} 个档案`)

    // 2. 遍历每个档案，计算实际的检测记录数量
    for (const archive of archives) {
      console.log(`\n🔍 处理档案: ${archive.archiveName}`)
      console.log(`   当前 photoCount: ${archive.photoCount}`)

      // 查询该档案的检测记录数量
      const detectionCount = await prisma.detection.count({
        where: {
          subUserId: archive.subUserId,
          archiveName: archive.archiveName,
          status: 'completed'
        }
      })

      console.log(`   实际检测记录数量: ${detectionCount}`)

      // 如果数量不匹配，更新档案
      if (detectionCount !== archive.photoCount) {
        console.log(`   ⚠️ 数量不匹配，正在修复...`)
        
        await prisma.archive.update({
          where: { id: archive.id },
          data: {
            photoCount: detectionCount,
            updatedAt: new Date()
          }
        })

        console.log(`   ✅ 已修复 photoCount: ${detectionCount}`)
      } else {
        console.log(`   ✅ photoCount 已正确`)
      }
    }

    // 3. 验证修复结果
    console.log('\n📋 验证修复结果:')
    const fixedArchives = await prisma.archive.findMany({
      select: {
        id: true,
        archiveName: true,
        photoCount: true,
        subUserId: true
      }
    })

    for (const archive of fixedArchives) {
      const detectionCount = await prisma.detection.count({
        where: {
          subUserId: archive.subUserId,
          archiveName: archive.archiveName,
          status: 'completed'
        }
      })

      console.log(`- ${archive.archiveName}: photoCount=${archive.photoCount}, 实际检测记录=${detectionCount}`)
      
      if (archive.photoCount === detectionCount) {
        console.log(`  ✅ 修复成功`)
      } else {
        console.log(`  ❌ 修复失败`)
      }
    }

    console.log('\n✅ 档案 photoCount 修复完成！')

  } catch (error) {
    console.error('❌ 修复失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行修复
fixExistingArchives()
  .then(() => {
    console.log('✅ 修复脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 修复脚本执行失败:', error)
    process.exit(1)
  }) 