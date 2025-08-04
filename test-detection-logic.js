import { PrismaClient } from './generated/prisma/index.js'

const prisma = new PrismaClient()

async function testDetectionLogic() {
  try {
    console.log('🔍 测试检测记录逻辑...')
    
    const subUserId = 'cmdxkkzq8002cs6i8s7cs61rr'
    const archiveName = '左手大拇指'
    
    // 检查档案
    const archive = await prisma.archive.findFirst({
      where: {
        id: 'cmdxkzs6q002es6i822wztymi',
        subUserId: subUserId
      }
    })
    
    console.log('📁 档案信息:')
    console.log('  - 存在:', !!archive)
    if (archive) {
      console.log('  - 名称:', archive.archiveName)
      console.log('  - 照片数:', archive.photoCount)
    }
    
    // 检查所有检测记录
    const allDetections = await prisma.detection.findMany({
      where: {
        subUserId: subUserId,
        archiveName: archiveName
      },
      select: {
        id: true,
        status: true,
        result: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    console.log(`📋 所有检测记录 (${allDetections.length} 条):`)
    allDetections.forEach((detection, index) => {
      console.log(`  ${index + 1}. ID: ${detection.id}`)
      console.log(`     状态: ${detection.status}`)
      console.log(`     结果: ${detection.result}`)
      console.log(`     时间: ${detection.createdAt}`)
    })
    
    // 检查completed状态的检测记录
    const completedDetections = await prisma.detection.findMany({
      where: {
        subUserId: subUserId,
        archiveName: archiveName,
        status: 'completed'
      }
    })
    
    console.log(`📋 completed状态检测记录: ${completedDetections.length} 条`)
    
    // 模拟接口逻辑
    if (allDetections.length > 0) {
      console.log('🎯 接口逻辑判断: 治疗过程拍照 (已有检测记录)')
    } else {
      console.log('🎯 接口逻辑判断: 创建第一份报告 (无检测记录)')
    }
    
  } catch (error) {
    console.error('❌ 测试错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDetectionLogic() 