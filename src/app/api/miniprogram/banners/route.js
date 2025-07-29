import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取Banner列表（小程序专用）
async function getBanners(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 5
    
    // TODO: 从数据库获取活跃的Banner
    // const banners = await prisma.banner.findMany({
    //   where: {
    //     isActive: true,
    //     AND: [
    //       { startTime: { lte: new Date() } },
    //       { endTime: { gte: new Date() } }
    //     ]
    //   },
    //   orderBy: [
    //     { sort: 'asc' },
    //     { createdAt: 'desc' }
    //   ],
    //   take: limit,
    //   select: {
    //     id: true,
    //     title: true,
    //     imageUrl: true,
    //     linkUrl: true,
    //     sort: true
    //   }
    // })

    // TODO: 从数据库获取Banner配置
    // const configs = await prisma.systemConfig.findMany({
    //   where: {
    //     key: {
    //       in: ['banner_interval', 'banner_autoplay']
    //     }
    //   }
    // })
    // const configObject = {}
    // configs.forEach(config => {
    //   configObject[config.key] = config.value
    // })

    // 模拟数据
    const mockBanners = [
      {
        id: 1,
        title: '欢迎使用指纹检测',
        imageUrl: '/uploads/banner1.jpg',
        linkUrl: '/pages/index/index',
        sort: 1
      },
      {
        id: 2,
        title: '专业检测服务',
        imageUrl: '/uploads/banner2.jpg',
        linkUrl: '/pages/service/service',
        sort: 2
      }
    ]

    // 模拟配置数据
    const mockConfig = {
      banner_interval: '3',
      banner_autoplay: 'true'
    }

    return createSuccessResponse({
      banners: mockBanners,
      config: {
        interval: parseInt(mockConfig.banner_interval) * 1000, // 转换为毫秒
        autoplay: mockConfig.banner_autoplay === 'true'
      }
    }, '获取Banner列表成功')

  } catch (error) {
    console.error('获取Banner列表错误:', error)
    return createErrorResponse('获取Banner列表失败')
  }
}

// 使用中间件包装处理函数
export const GET = miniprogramAuthMiddleware(getBanners) 