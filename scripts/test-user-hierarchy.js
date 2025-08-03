const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function testUserHierarchy() {
  try {
    console.log('🧪 开始测试用户层级关系...')

    // 1. 测试获取微信用户列表
    console.log('\n1. 测试获取微信用户列表:')
    const wechatUsers = await prisma.wechatUser.findMany({
      include: {
        subUsers: true,
        systemInfo: true
      }
    })
    
    wechatUsers.forEach(user => {
      console.log(`- 微信用户: ${user.nickname} (${user.openid})`)
      console.log(`  子用户数量: ${user.subUsers.length}`)
      user.subUsers.forEach(subUser => {
        console.log(`  - 子用户: ${subUser.realName} (${subUser.username})`)
      })
    })

    // 2. 测试获取子用户列表
    console.log('\n2. 测试获取子用户列表:')
    const subUsers = await prisma.subUser.findMany({
      include: {
        wechatUser: {
          select: {
            nickname: true,
            openid: true
          }
        },
        detections: true
      }
    })
    
    subUsers.forEach(subUser => {
      console.log(`- 子用户: ${subUser.realName} (${subUser.username})`)
      console.log(`  所属微信用户: ${subUser.wechatUser.nickname}`)
      console.log(`  检测记录数量: ${subUser.detections.length}`)
    })

    // 3. 测试检测记录
    console.log('\n3. 测试检测记录:')
    const detections = await prisma.detection.findMany({
      include: {
        subUser: {
          select: {
            realName: true,
            wechatUser: {
              select: {
                nickname: true
              }
            }
          }
        }
      }
    })
    
    detections.forEach(detection => {
      console.log(`- 检测记录: ${detection.archiveName}`)
      console.log(`  子用户: ${detection.subUser.realName}`)
      console.log(`  微信用户: ${detection.subUser.wechatUser.nickname}`)
      console.log(`  检测类型: ${detection.detectionType}`)
      console.log(`  结果: ${detection.result}`)
    })

    // 4. 测试统计信息
    console.log('\n4. 测试统计信息:')
    const stats = await prisma.subUser.findMany({
      select: {
        realName: true,
        archives: true,
        photos: true,
        reports: true,
        detections: {
          select: {
            id: true
          }
        }
      }
    })
    
    stats.forEach(stat => {
      console.log(`- ${stat.realName}:`)
      console.log(`  档案数: ${stat.archives}`)
      console.log(`  照片数: ${stat.photos}`)
      console.log(`  报告数: ${stat.reports}`)
      console.log(`  检测记录数: ${stat.detections.length}`)
    })

    console.log('\n✅ 用户层级关系测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testUserHierarchy()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 