const { PrismaClient } = require('../src/generated/prisma/index.js');

const prisma = new PrismaClient();

async function initProductionDatabase() {
  console.log('🚀 开始初始化生产环境数据库...');

  try {
    // 1. 创建管理员账号
    console.log('👤 创建管理员账号...');
    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: '$2a$10$rQZ8K9mN2pL1vX3yJ6hF8eS4tU7wA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2x',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });
    console.log('✅ 管理员账号创建成功:', admin.username);

    // 2. 创建默认企业信息
    console.log('🏢 创建默认企业信息...');
    const company = await prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '指纹检测科技有限公司',
        description: '专业的指纹检测服务提供商',
        address: '北京市朝阳区科技园区',
        phone: '400-123-4567',
        email: 'contact@finger-detect.com',
        website: 'https://finger-detect.com',
        logo: '/uploads/company-logo.png',
        status: 'ACTIVE'
      }
    });
    console.log('✅ 企业信息创建成功:', company.name);

    // 3. 创建测试用户ID
    console.log('🆔 创建测试用户ID...');
    const userIds = [];
    for (let i = 1; i <= 10; i++) {
      const userId = await prisma.userId.upsert({
        where: { idNumber: `ID${String(i).padStart(6, '0')}` },
        update: {},
        create: {
          idNumber: `ID${String(i).padStart(6, '0')}`,
          realName: `测试用户${i}`,
          idCardFront: `/uploads/id-front-${i}.jpg`,
          verifyStatus: 'VERIFIED',
          age: 25 + i,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          address: `北京市朝阳区第${i}街道`,
          identity: 'CITIZEN',
          status: 'ACTIVE',
          subUsers: i * 2,
          archives: i * 3,
          photos: i * 5,
          reports: i * 2,
          unreadMessages: i
        }
      });
      userIds.push(userId);
    }
    console.log('✅ 测试用户ID创建成功，共', userIds.length, '个');

    // 4. 创建测试用户
    console.log('👥 创建测试用户...');
    const users = [];
    for (let i = 1; i <= 20; i++) {
      const user = await prisma.user.upsert({
        where: { username: `user${i}` },
        update: {},
        create: {
          username: `user${i}`,
          nickname: `微信用户${i}`,
          realName: `真实用户${i}`,
          email: `user${i}@example.com`,
          age: 20 + i,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          address: `上海市浦东新区第${i}街道`,
          status: 'ACTIVE',
          userId: userIds[i % userIds.length].id,
          archives: i * 2,
          photos: i * 3,
          reports: i,
          lastLogin: new Date(),
          remark: `测试用户${i}的备注信息`
        }
      });
      users.push(user);
    }
    console.log('✅ 测试用户创建成功，共', users.length, '个');

    // 5. 创建测试资讯
    console.log('📰 创建测试资讯...');
    const news = [];
    for (let i = 1; i <= 15; i++) {
      const newsItem = await prisma.news.upsert({
        where: { title: `测试资讯${i}` },
        update: {},
        create: {
          title: `测试资讯${i}`,
          content: `这是第${i}条测试资讯的内容，包含详细的指纹检测相关信息。`,
          type: i % 3 === 0 ? 'TECHNOLOGY' : i % 3 === 1 ? 'NEWS' : 'ANNOUNCEMENT',
          status: 'PUBLISHED',
          author: '系统管理员',
          publishDate: new Date(),
          viewCount: i * 100,
          imageUrl: `/uploads/news-${i}.jpg`
        }
      });
      news.push(newsItem);
    }
    console.log('✅ 测试资讯创建成功，共', news.length, '条');

    // 6. 创建测试档案
    console.log('📁 创建测试档案...');
    const archives = [];
    for (let i = 1; i <= 25; i++) {
      const archive = await prisma.archive.upsert({
        where: { archiveName: `档案${i}` },
        update: {},
        create: {
          userId: users[i % users.length].id,
          userNickname: users[i % users.length].nickname,
          archiveName: `档案${i}`,
          activity: i % 2 === 0 ? '指纹录入' : '指纹比对',
          photoCount: i * 2,
          bodyPart: i % 3 === 0 ? '右手食指' : i % 3 === 1 ? '左手拇指' : '右手拇指',
          detectionTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      });
      archives.push(archive);
    }
    console.log('✅ 测试档案创建成功，共', archives.length, '个');

    // 7. 创建测试检测记录
    console.log('🔍 创建测试检测记录...');
    const detections = [];
    for (let i = 1; i <= 30; i++) {
      const detection = await prisma.detection.upsert({
        where: { id: `detection-${i}` },
        update: {},
        create: {
          userId: users[i % users.length].id,
          userNickname: users[i % users.length].nickname,
          archiveName: archives[i % archives.length].archiveName,
          bodyPart: i % 3 === 0 ? '右手食指' : i % 3 === 1 ? '左手拇指' : '右手拇指',
          detectionTime: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
          result: i % 2 === 0 ? 'MATCH' : 'NO_MATCH',
          confidence: 85 + (i % 15),
          status: 'COMPLETED'
        }
      });
      detections.push(detection);
    }
    console.log('✅ 测试检测记录创建成功，共', detections.length, '条');

    // 8. 创建测试反馈
    console.log('💬 创建测试反馈...');
    const feedbacks = [];
    for (let i = 1; i <= 20; i++) {
      const feedback = await prisma.feedback.upsert({
        where: { id: `feedback-${i}` },
        update: {},
        create: {
          userId: users[i % users.length].id,
          userNickname: users[i % users.length].nickname,
          type: i % 3 === 0 ? 'BUG_REPORT' : i % 3 === 1 ? 'FEATURE_REQUEST' : 'GENERAL',
          title: `反馈标题${i}`,
          content: `这是第${i}条反馈的内容，用户对系统提出了宝贵的建议。`,
          status: i % 2 === 0 ? 'PENDING' : 'REPLIED',
          reply: i % 2 === 0 ? null : `感谢您的反馈，我们会认真考虑您的建议。`,
          createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000)
        }
      });
      feedbacks.push(feedback);
    }
    console.log('✅ 测试反馈创建成功，共', feedbacks.length, '条');

    // 9. 创建系统消息
    console.log('📢 创建系统消息...');
    const systemMessages = [];
    for (let i = 1; i <= 10; i++) {
      const message = await prisma.systemReply.upsert({
        where: { title: `系统消息${i}` },
        update: {},
        create: {
          title: `系统消息${i}`,
          type: i % 3 === 0 ? 'ANNOUNCEMENT' : i % 3 === 1 ? 'NOTIFICATION' : 'UPDATE',
          targetUsers: i % 2 === 0 ? 'ALL_USERS' : 'ACTIVE_USERS',
          content: `这是第${i}条系统消息，包含重要的系统更新信息。`,
          status: 'PUBLISHED',
          readCount: i * 50,
          totalCount: i * 100,
          publishedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000)
        }
      });
      systemMessages.push(message);
    }
    console.log('✅ 系统消息创建成功，共', systemMessages.length, '条');

    // 10. 创建优惠券
    console.log('🎫 创建优惠券...');
    const coupons = [];
    for (let i = 1; i <= 15; i++) {
      const coupon = await prisma.coupon.upsert({
        where: { name: `优惠券${i}` },
        update: {},
        create: {
          name: `优惠券${i}`,
          type: i % 3 === 0 ? 'DISCOUNT' : i % 3 === 1 ? 'CASH' : 'FREE_SERVICE',
          value: i * 10,
          minAmount: i * 50,
          channel: i % 2 === 0 ? 'ONLINE' : 'OFFLINE',
          targetUsers: i % 2 === 0 ? 'ALL_USERS' : 'NEW_USERS',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          description: `第${i}张优惠券，享受${i * 10}元优惠`
        }
      });
      coupons.push(coupon);
    }
    console.log('✅ 优惠券创建成功，共', coupons.length, '张');

    console.log('🎉 生产环境数据库初始化完成！');
    console.log('📊 数据统计:');
    console.log('  - 管理员: 1个');
    console.log('  - 企业信息: 1个');
    console.log('  - 用户ID: 10个');
    console.log('  - 用户: 20个');
    console.log('  - 资讯: 15条');
    console.log('  - 档案: 25个');
    console.log('  - 检测记录: 30条');
    console.log('  - 反馈: 20条');
    console.log('  - 系统消息: 10条');
    console.log('  - 优惠券: 15张');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initProductionDatabase()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initProductionDatabase }; 