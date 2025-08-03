const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBanners() {
  try {
    console.log('开始添加轮播图数据...')

    // 检查是否已有轮播图数据
    const existingBanners = await prisma.banner.count()
    if (existingBanners > 0) {
      console.log(`数据库中已有 ${existingBanners} 条轮播图数据，跳过添加`)
      return
    }

    // 添加轮播图数据
    const bannerData = [
      {
        title: '欢迎使用指纹检测',
        imageUrl: '/uploads/1753695692581_bx6dkiv1bbn.png',
        linkUrl: '/pages/index/index',
        sort: 1,
        isActive: true,
        startTime: null,
        endTime: null
      },
      {
        title: '专业检测服务',
        imageUrl: '/uploads/1753694778560_amo65patk7e.png',
        linkUrl: '/pages/service/service',
        sort: 2,
        isActive: true,
        startTime: null,
        endTime: null
      },
      {
        title: '最新技术更新',
        imageUrl: '/uploads/1753695692581_bx6dkiv1bbn.png',
        linkUrl: '/pages/news/news',
        sort: 3,
        isActive: true,
        startTime: null,
        endTime: null
      }
    ]

    // 批量创建轮播图
    const createdBanners = await prisma.banner.createMany({
      data: bannerData
    })

    console.log(`✅ 成功添加 ${createdBanners.count} 条轮播图数据`)

    // 添加轮播图配置
    const configData = [
      {
        key: 'banner_interval',
        value: '3',
        description: '轮播图切换间隔（秒）',
        type: 'number',
        isPublic: true
      },
      {
        key: 'banner_autoplay',
        value: 'true',
        description: '轮播图是否自动播放',
        type: 'boolean',
        isPublic: true
      }
    ]

    // 批量创建配置
    const createdConfigs = await prisma.systemConfig.createMany({
      data: configData,
      skipDuplicates: true
    })

    console.log(`✅ 成功添加 ${createdConfigs.count} 条配置数据`)

    // 显示添加的轮播图
    const allBanners = await prisma.banner.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        isActive: true,
        sort: true
      },
      orderBy: { sort: 'asc' }
    })

    console.log('\n🎠 数据库中的轮播图列表：')
    allBanners.forEach(banner => {
      console.log(`- ID: ${banner.id}, 标题: ${banner.title}, 排序: ${banner.sort}, 状态: ${banner.isActive ? '启用' : '禁用'}`)
    })

  } catch (error) {
    console.error('❌ 添加轮播图数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
seedBanners() 