const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedUserHierarchy() {
  try {
    console.log('🌱 开始创建用户层级关系测试数据...')

    // 1. 创建微信用户
    const wechatUser1 = await prisma.wechatUser.create({
      data: {
        openid: 'test_openid_001',
        unionid: 'test_unionid_001',
        nickname: '测试微信用户1',
        avatar: 'https://example.com/avatar1.jpg',
        gender: '1',
        city: '深圳',
        province: '广东',
        country: '中国',
        status: 'active',
        registerTime: new Date(),
        lastLogin: new Date(),
        appVersion: '1.0.0'
      }
    })
    console.log('✅ 创建微信用户1:', wechatUser1.nickname)

    const wechatUser2 = await prisma.wechatUser.create({
      data: {
        openid: 'test_openid_002',
        unionid: 'test_unionid_002',
        nickname: '测试微信用户2',
        avatar: 'https://example.com/avatar2.jpg',
        gender: '2',
        city: '北京',
        province: '北京',
        country: '中国',
        status: 'active',
        registerTime: new Date(),
        lastLogin: new Date(),
        appVersion: '1.0.0'
      }
    })
    console.log('✅ 创建微信用户2:', wechatUser2.nickname)

    // 2. 为微信用户1创建子用户
    const subUser1 = await prisma.subUser.create({
      data: {
        wechatUserId: wechatUser1.id,
        username: 'subuser001',
        realName: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        age: 25,
        gender: '1',
        address: '广东省深圳市南山区',
        status: 'active',
        archives: 5,
        photos: 10,
        reports: 3
      }
    })
    console.log('✅ 创建子用户1:', subUser1.realName)

    const subUser2 = await prisma.subUser.create({
      data: {
        wechatUserId: wechatUser1.id,
        username: 'subuser002',
        realName: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        age: 30,
        gender: '1',
        address: '广东省深圳市福田区',
        status: 'active',
        archives: 3,
        photos: 8,
        reports: 2
      }
    })
    console.log('✅ 创建子用户2:', subUser2.realName)

    // 3. 为微信用户2创建子用户
    const subUser3 = await prisma.subUser.create({
      data: {
        wechatUserId: wechatUser2.id,
        username: 'subuser003',
        realName: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        age: 28,
        gender: '2',
        address: '北京市朝阳区',
        status: 'active',
        archives: 7,
        photos: 15,
        reports: 5
      }
    })
    console.log('✅ 创建子用户3:', subUser3.realName)

    // 4. 创建用户系统信息
    await prisma.userSystemInfo.create({
      data: {
        wechatUserId: wechatUser1.id,
        platform: 'ios',
        system: 'iOS 16.0',
        version: '1.0.0',
        SDKVersion: '3.0.0',
        brand: 'Apple',
        model: 'iPhone 14',
        screenWidth: 390,
        screenHeight: 844,
        windowWidth: 390,
        windowHeight: 844,
        pixelRatio: 3.0,
        language: 'zh-CN'
      }
    })
    console.log('✅ 创建用户1系统信息')

    await prisma.userSystemInfo.create({
      data: {
        wechatUserId: wechatUser2.id,
        platform: 'android',
        system: 'Android 12',
        version: '1.0.0',
        SDKVersion: '3.0.0',
        brand: 'Huawei',
        model: 'P40',
        screenWidth: 360,
        screenHeight: 780,
        windowWidth: 360,
        windowHeight: 780,
        pixelRatio: 2.75,
        language: 'zh-CN'
      }
    })
    console.log('✅ 创建用户2系统信息')

    // 5. 创建一些检测记录
    await prisma.detection.create({
      data: {
        subUserId: subUser1.id,
        archiveName: '张三档案1',
        detectionType: 'fingerprint',
        result: 'normal',
        confidence: 0.95,
        imageUrl: '/uploads/detection1.jpg',
        remark: '测试检测记录1'
      }
    })
    console.log('✅ 创建检测记录1')

    await prisma.detection.create({
      data: {
        subUserId: subUser1.id,
        archiveName: '张三档案2',
        detectionType: 'face',
        result: 'normal',
        confidence: 0.92,
        imageUrl: '/uploads/detection2.jpg',
        remark: '测试检测记录2'
      }
    })
    console.log('✅ 创建检测记录2')

    await prisma.detection.create({
      data: {
        subUserId: subUser3.id,
        archiveName: '王五档案1',
        detectionType: 'fingerprint',
        result: 'abnormal',
        confidence: 0.88,
        imageUrl: '/uploads/detection3.jpg',
        remark: '测试检测记录3'
      }
    })
    console.log('✅ 创建检测记录3')

    console.log('🎉 用户层级关系测试数据创建完成！')
    console.log('\n📊 数据统计:')
    console.log(`- 微信用户: ${await prisma.wechatUser.count()} 个`)
    console.log(`- 子用户: ${await prisma.subUser.count()} 个`)
    console.log(`- 检测记录: ${await prisma.detection.count()} 条`)

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行种子脚本
seedUserHierarchy()
  .then(() => {
    console.log('✅ 种子脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 种子脚本执行失败:', error)
    process.exit(1)
  }) 