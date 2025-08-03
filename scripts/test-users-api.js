const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function testUsersApi() {
  try {
    console.log('🧪 开始测试用户接口...')

    // 1. 获取第一个微信用户作为测试用户
    const testWechatUser = await prisma.wechatUser.findFirst({
      include: {
        subUsers: true
      }
    })

    if (!testWechatUser) {
      console.log('❌ 没有找到测试用的微信用户')
      return
    }

    console.log(`📋 使用测试微信用户: ${testWechatUser.nickname} (${testWechatUser.openid})`)
    console.log(`📊 当前子用户数量: ${testWechatUser.subUsers.length}`)

    // 2. 模拟 GET 请求 - 获取子用户列表
    console.log('\n1. 测试获取子用户列表 (GET /api/miniprogram/users):')
    
    // 模拟认证中间件的行为
    const mockRequest = {
      user: {
        id: testWechatUser.id,
        openid: testWechatUser.openid,
        nickname: testWechatUser.nickname,
        currentSubUser: testWechatUser.subUsers[0] || null
      }
    }

    // 获取微信用户信息
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { id: mockRequest.user.id },
      select: {
        id: true,
        openid: true,
        nickname: true,
        avatar: true,
        gender: true,
        city: true,
        province: true,
        country: true,
        status: true,
        lastLogin: true,
        registerTime: true
      }
    })

    // 获取子用户列表
    const subUsers = await prisma.subUser.findMany({
      where: { 
        wechatUserId: mockRequest.user.id,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        age: true,
        gender: true,
        address: true,
        status: true,
        archives: true,
        photos: true,
        reports: true,
        remark: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 处理手机号脱敏
    const processedSubUsers = subUsers.map(user => ({
      ...user,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }))

    // 构建响应数据
    const responseData = {
      wechatUser: {
        id: wechatUser.id,
        openid: wechatUser.openid,
        nickname: wechatUser.nickname,
        avatar: wechatUser.avatar,
        avatarUrl: wechatUser.avatar,
        gender: wechatUser.gender,
        city: wechatUser.city,
        province: wechatUser.province,
        country: wechatUser.country,
        status: wechatUser.status,
        lastLogin: wechatUser.lastLogin,
        registerTime: wechatUser.registerTime
      },
      subUsers: processedSubUsers,
      totalCount: subUsers.length,
      currentSubUser: mockRequest.user.currentSubUser ? {
        id: mockRequest.user.currentSubUser.id,
        username: mockRequest.user.currentSubUser.username,
        realName: mockRequest.user.currentSubUser.realName
      } : null
    }

    console.log('✅ 获取子用户列表成功:')
    console.log(`- 微信用户: ${responseData.wechatUser.nickname}`)
    console.log(`- 子用户数量: ${responseData.totalCount}`)
    console.log(`- 当前子用户: ${responseData.currentSubUser?.realName || '无'}`)
    
    responseData.subUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.realName} (${user.username})`)
      console.log(`     手机: ${user.phone || '未设置'}`)
      console.log(`     档案: ${user.archives}, 照片: ${user.photos}, 报告: ${user.reports}`)
    })

    // 3. 测试创建新子用户
    console.log('\n2. 测试创建新子用户 (POST /api/miniprogram/users):')
    
    const newSubUserData = {
      username: `testuser${Date.now()}`,
      realName: '测试用户',
      phone: '13800138000',
      email: 'test@example.com',
      age: 25,
      gender: '1',
      address: '广东省深圳市',
      remark: '测试创建的子用户'
    }

    // 检查用户名是否已存在
    const existingSubUser = await prisma.subUser.findFirst({
      where: { 
        wechatUserId: mockRequest.user.id,
        username: newSubUserData.username 
      }
    })

    if (existingSubUser) {
      console.log('⚠️ 用户名已存在，跳过创建测试')
    } else {
      // 创建新子用户
      const newSubUser = await prisma.subUser.create({
        data: {
          wechatUserId: mockRequest.user.id,
          username: newSubUserData.username,
          realName: newSubUserData.realName,
          phone: newSubUserData.phone,
          email: newSubUserData.email,
          age: parseInt(newSubUserData.age),
          gender: newSubUserData.gender,
          address: newSubUserData.address,
          status: 'active',
          remark: newSubUserData.remark,
          archives: 0,
          photos: 0,
          reports: 0
        },
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          age: true,
          gender: true,
          address: true,
          status: true,
          remark: true,
          archives: true,
          photos: true,
          reports: true,
          createdAt: true,
          updatedAt: true
        }
      })

      console.log('✅ 新子用户创建成功:')
      console.log(`- 用户名: ${newSubUser.username}`)
      console.log(`- 真实姓名: ${newSubUser.realName}`)
      console.log(`- 手机: ${newSubUser.phone}`)
      console.log(`- 邮箱: ${newSubUser.email}`)

      // 清理测试数据
      await prisma.subUser.delete({
        where: { id: newSubUser.id }
      })
      console.log('🧹 测试数据已清理')
    }

    console.log('\n✅ 用户接口测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testUsersApi()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 