const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function initRemoteTestData() {
  try {
    console.log('🚀 开始初始化远程服务器测试数据...')

    // 1. 创建测试微信用户
    console.log('👤 创建测试微信用户...')
    const wechatUser1 = await prisma.wechatUser.upsert({
      where: { openid: 'test_openid_001' },
      update: {},
      create: {
        openid: 'test_openid_001',
        unionid: 'test_unionid_001',
        nickname: '测试微信用户1',
        avatar: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=测1',
        gender: '1',
        city: '北京',
        province: '北京',
        country: '中国',
        status: 'active'
      }
    })

    const wechatUser2 = await prisma.wechatUser.upsert({
      where: { openid: 'test_openid_002' },
      update: {},
      create: {
        openid: 'test_openid_002',
        unionid: 'test_unionid_002',
        nickname: '测试微信用户2',
        avatar: 'https://via.placeholder.com/100x100/DC2626/FFFFFF?text=测2',
        gender: '2',
        city: '上海',
        province: '上海',
        country: '中国',
        status: 'active'
      }
    })

    console.log('✅ 微信用户创建成功')

    // 2. 创建测试子用户
    console.log('👥 创建测试子用户...')
    const subUser1 = await prisma.subUser.upsert({
      where: { username: 'subuser001' },
      update: {},
      create: {
        wechatUserId: wechatUser1.id,
        username: 'subuser001',
        realName: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        age: 25,
        gender: '男',
        address: '北京市朝阳区',
        status: 'active',
        archives: 6,
        photos: 12,
        reports: 4
      }
    })

    const subUser2 = await prisma.subUser.upsert({
      where: { username: 'subuser002' },
      update: {},
      create: {
        wechatUserId: wechatUser1.id,
        username: 'subuser002',
        realName: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        age: 28,
        gender: '女',
        address: '北京市海淀区',
        status: 'active',
        archives: 3,
        photos: 8,
        reports: 4
      }
    })

    const subUser3 = await prisma.subUser.upsert({
      where: { username: 'subuser003' },
      update: {},
      create: {
        wechatUserId: wechatUser2.id,
        username: 'subuser003',
        realName: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        age: 30,
        gender: '男',
        address: '上海市浦东新区',
        status: 'active',
        archives: 7,
        photos: 15,
        reports: 5
      }
    })

    console.log('✅ 子用户创建成功')

    // 3. 创建测试检测记录
    console.log('🔍 创建测试检测记录...')
    const detection1 = await prisma.detection.upsert({
      where: { id: 'test_detection_001' },
      update: {},
      create: {
        id: 'test_detection_001',
        subUserId: subUser1.id,
        archiveName: '张三档案1',
        detectionType: 'left_hand_thumb',
        imageUrl: '/uploads/detection1.jpg',
        result: 'normal',
        confidence: 0.95,
        status: 'completed',
        remark: '测试检测记录1',
        detectionTime: new Date()
      }
    })

    const detection2 = await prisma.detection.upsert({
      where: { id: 'test_detection_002' },
      update: {},
      create: {
        id: 'test_detection_002',
        subUserId: subUser1.id,
        archiveName: '张三档案2',
        detectionType: 'left_hand_index',
        imageUrl: '/uploads/detection2.jpg',
        result: 'normal',
        confidence: 0.92,
        status: 'completed',
        remark: '测试检测记录2',
        detectionTime: new Date()
      }
    })

    const detection3 = await prisma.detection.upsert({
      where: { id: 'test_detection_003' },
      update: {},
      create: {
        id: 'test_detection_003',
        subUserId: subUser3.id,
        archiveName: '王五档案1',
        detectionType: 'right_hand_thumb',
        imageUrl: '/uploads/detection3.jpg',
        result: 'abnormal',
        confidence: 0.78,
        status: 'completed',
        remark: '测试检测记录3',
        detectionTime: new Date()
      }
    })

    console.log('✅ 检测记录创建成功')

    // 4. 创建测试档案
    console.log('📁 创建测试档案...')
    const archive1 = await prisma.archive.upsert({
      where: {
        subUserId_archiveName: {
          subUserId: subUser1.id,
          archiveName: '张三档案1'
        }
      },
      update: {},
      create: {
        subUserId: subUser1.id,
        archiveName: '张三档案1',
        bodyPart: 'left_hand_thumb',
        activity: 'medium',
        photoCount: 3,
        detectionTime: new Date()
      }
    })

    const archive2 = await prisma.archive.upsert({
      where: {
        subUserId_archiveName: {
          subUserId: subUser1.id,
          archiveName: '张三档案2'
        }
      },
      update: {},
      create: {
        subUserId: subUser1.id,
        archiveName: '张三档案2',
        bodyPart: 'left_hand_index',
        activity: 'high',
        photoCount: 2,
        detectionTime: new Date()
      }
    })

    console.log('✅ 档案创建成功')

    console.log('\n🎉 远程服务器测试数据初始化完成！')
    console.log('📊 数据统计:')
    console.log('  - 微信用户: 2个')
    console.log('  - 子用户: 3个')
    console.log('  - 检测记录: 3条')
    console.log('  - 档案: 2个')
    console.log('\n🔑 测试凭据:')
    console.log('  - OpenID: test_openid_001')
    console.log('  - 用户名: subuser001, subuser002, subuser003')

  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
    console.error('错误堆栈:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
initRemoteTestData()
  .then(() => {
    console.log('\n✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  }) 