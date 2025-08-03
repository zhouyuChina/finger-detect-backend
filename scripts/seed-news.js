const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedNews() {
  try {
    console.log('开始添加测试新闻数据...')

    // 检查是否已有新闻数据
    const existingNews = await prisma.news.count()
    if (existingNews > 0) {
      console.log(`数据库中已有 ${existingNews} 条新闻数据，跳过添加`)
      return
    }

    // 添加测试新闻数据
    const newsData = [
      {
        title: '指纹检测技术最新进展',
        summary: '随着人工智能技术的发展，指纹检测技术取得了重大突破。新的算法能够更准确地识别和验证指纹特征，大大提高了检测的准确性和效率。',
        content: `
          <h2>技术突破</h2>
          <p>最新的指纹检测技术采用了深度学习算法，能够处理更复杂的指纹图像，即使在光线不足或指纹不完整的情况下也能准确识别。</p>
          
          <h2>应用场景</h2>
          <p>这项技术广泛应用于：</p>
          <ul>
            <li>移动设备解锁</li>
            <li>银行安全验证</li>
            <li>企业门禁系统</li>
            <li>政府身份认证</li>
          </ul>
          
          <h2>未来展望</h2>
          <p>随着技术的不断进步，指纹检测将变得更加智能化和便捷，为用户提供更好的安全体验。</p>
        `,
        coverImage: '/uploads/1753695692581_bx6dkiv1bbn.png',
        author: '技术团队',
        category: '技术资讯',
        tags: ['指纹检测', 'AI技术', '安全'],
        viewCount: 1250,
        isPublished: true,
        publishedAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        title: '系统维护通知',
        summary: '为了提供更好的服务体验，系统将于本周日进行维护升级。维护期间可能会影响部分功能的使用，请用户提前做好准备。',
        content: `
          <h2>维护时间</h2>
          <p>维护时间：2024年1月21日 凌晨2:00-6:00</p>
          
          <h2>影响范围</h2>
          <p>维护期间以下功能可能受到影响：</p>
          <ul>
            <li>用户注册和登录</li>
            <li>指纹检测服务</li>
            <li>数据查询功能</li>
          </ul>
          
          <h2>注意事项</h2>
          <p>请用户提前保存重要数据，维护完成后系统将自动恢复正常服务。</p>
        `,
        coverImage: '/uploads/1753694778560_amo65patk7e.png',
        author: '系统管理员',
        category: '系统通知',
        tags: ['系统维护', '升级', '通知'],
        viewCount: 856,
        isPublished: true,
        publishedAt: new Date('2024-01-14T15:30:00Z')
      },
      {
        title: '用户体验优化更新',
        summary: '我们听取了用户的宝贵意见，对小程序界面进行了全面优化。新的界面更加简洁美观，操作更加便捷。',
        content: `
          <h2>界面优化</h2>
          <p>本次更新主要包括：</p>
          <ul>
            <li>重新设计的主页布局</li>
            <li>优化的导航菜单</li>
            <li>改进的指纹检测流程</li>
            <li>更好的错误提示</li>
          </ul>
          
          <h2>功能改进</h2>
          <p>新增功能：</p>
          <ul>
            <li>检测历史记录</li>
            <li>结果分享功能</li>
            <li>用户反馈系统</li>
          </ul>
          
          <h2>性能提升</h2>
          <p>优化了应用启动速度和检测响应时间，提供更流畅的用户体验。</p>
        `,
        coverImage: null,
        author: '产品团队',
        category: '产品更新',
        tags: ['用户体验', '界面优化', '功能更新'],
        viewCount: 632,
        isPublished: true,
        publishedAt: new Date('2024-01-13T14:20:00Z')
      },
      {
        title: '指纹检测安全指南',
        summary: '为了确保指纹检测的安全性和准确性，我们为您提供详细的安全使用指南。',
        content: `
          <h2>使用前准备</h2>
          <p>确保手指清洁干燥，避免有污渍或水分影响检测结果。</p>
          
          <h2>检测步骤</h2>
          <ol>
            <li>将手指轻轻放在检测区域</li>
            <li>保持手指稳定，不要移动</li>
            <li>等待检测完成</li>
            <li>查看检测结果</li>
          </ol>
          
          <h2>注意事项</h2>
          <p>请勿在以下情况下进行检测：</p>
          <ul>
            <li>手指有伤口或疤痕</li>
            <li>手指过于干燥或湿润</li>
            <li>环境光线过暗</li>
          </ul>
        `,
        coverImage: null,
        author: '安全团队',
        category: '使用指南',
        tags: ['安全指南', '使用说明', '注意事项'],
        viewCount: 445,
        isPublished: true,
        publishedAt: new Date('2024-01-12T09:15:00Z')
      }
    ]

    // 批量创建新闻
    const createdNews = await prisma.news.createMany({
      data: newsData
    })

    console.log(`✅ 成功添加 ${createdNews.count} 条测试新闻数据`)

    // 显示添加的新闻
    const allNews = await prisma.news.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        isPublished: true,
        publishedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('\n📰 数据库中的新闻列表：')
    allNews.forEach(news => {
      console.log(`- ID: ${news.id}, 标题: ${news.title}, 分类: ${news.category}, 已发布: ${news.isPublished}`)
    })

  } catch (error) {
    console.error('❌ 添加测试新闻数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
seedNews() 