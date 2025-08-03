const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function debugNewUser() {
  try {
    console.log('🔍 调试新用户认证问题...\n')

    const openid = 'new_user_openid'
    const username = '新用户'

    // 1. 查找微信用户
    console.log('1. 查找微信用户...')
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { openid }
    })

    if (!wechatUser) {
      console.log('❌ 微信用户不存在:', openid)
      return
    }

    console.log('✅ 找到微信用户:', wechatUser.nickname)
    console.log('   微信用户ID:', wechatUser.id)
    console.log('   状态:', wechatUser.status)

    // 2. 查找子用户
    console.log('\n2. 查找子用户...')
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: wechatUser.id,
        username: username,
        status: 'active'
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在')
      console.log('   查找条件:')
      console.log('   - wechatUserId:', wechatUser.id)
      console.log('   - username:', username)
      console.log('   - status: active')
      
      // 查看该微信用户的所有子用户
      const allSubUsers = await prisma.subUser.findMany({
        where: { wechatUserId: wechatUser.id }
      })
      
      console.log('\n   该微信用户的所有子用户:')
      allSubUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.realName} (${user.username}) - ${user.status}`)
      })
      
      return
    }

    console.log('✅ 找到子用户:', subUser.realName)
    console.log('   子用户ID:', subUser.id)
    console.log('   用户名:', subUser.username)
    console.log('   状态:', subUser.status)

    // 3. 查找档案
    console.log('\n3. 查找档案...')
    const archives = await prisma.archive.findMany({
      where: { subUserId: subUser.id }
    })

    console.log(`✅ 找到 ${archives.length} 个档案:`)
    archives.forEach((archive, index) => {
      console.log(`   ${index + 1}. ${archive.archiveName} - ${archive.bodyPart}`)
    })

    // 4. 查找检测记录
    console.log('\n4. 查找检测记录...')
    const detections = await prisma.detection.findMany({
      where: { subUserId: subUser.id }
    })

    console.log(`✅ 找到 ${detections.length} 条检测记录:`)
    detections.forEach((detection, index) => {
      console.log(`   ${index + 1}. ${detection.archiveName} - ${detection.result}`)
    })

  } catch (error) {
    console.error('❌ 调试失败:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行调试
debugNewUser()
  .then(() => {
    console.log('\n✅ 调试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 调试失败:', error)
    process.exit(1)
  }) 