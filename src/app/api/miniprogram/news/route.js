import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取资讯列表（小程序专用）- 公开接口，无需认证
async function getNews(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    
    // TODO: 从数据库获取已发布的资讯
    // const where = {
    //   isPublished: true,
    //   status: 'published'
    // }
    // 
    // if (category) {
    //   where.category = category
    // }
    // 
    // if (search) {
    //   where.OR = [
    //     { title: { contains: search, mode: 'insensitive' } },
    //     { summary: { contains: search, mode: 'insensitive' } }
    //   ]
    // }
    // 
    // const [news, total] = await Promise.all([
    //   prisma.news.findMany({
    //     where,
    //     skip: (page - 1) * limit,
    //     take: limit,
    //     orderBy: [
    //       { isTop: 'desc' },
    //       { publishedAt: 'desc' },
    //       { createdAt: 'desc' }
    //   ],
    //   select: {
    //     id: true,
    //     title: true,
    //     summary: true,
    //     coverImage: true,
    //     author: true,
    //     category: true,
    //     tags: true,
    //     readCount: true,
    //     types: true,
    //     publishedAt: true,
    //     createdAt: true
    //   }
    //   }),
    //   prisma.news.count({ where })
    // ])

    // 模拟数据
    const mockNews = [
      {
        id: 1,
        title: '指纹检测技术最新进展',
        summary: '随着人工智能技术的发展，指纹检测技术取得了重大突破...',
        coverImage: '/uploads/1753695692581_bx6dkiv1bbn.png',
        author: '技术团队',
        category: '技术资讯',
        tags: ['指纹检测', 'AI技术'],
        readCount: 1250,
        types: ['置顶', '重要'],
        publishedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        createdAt: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: 2,
        title: '系统维护通知',
        summary: '为了提供更好的服务体验，系统将于本周日进行维护升级...',
        coverImage: '/uploads/1753694778560_amo65patk7e.png',
        author: '系统管理员',
        category: '系统通知',
        tags: ['系统维护', '升级'],
        readCount: 856,
        types: ['系统', '通知'],
        publishedAt: new Date('2024-01-14T15:30:00Z').toISOString(),
        createdAt: new Date('2024-01-14T15:00:00Z').toISOString()
      },
      {
        id: 3,
        title: '用户体验优化更新',
        summary: '我们听取了用户的宝贵意见，对小程序界面进行了全面优化...',
        coverImage: null,
        author: '产品团队',
        category: '产品更新',
        tags: ['用户体验', '界面优化'],
        readCount: 632,
        types: ['重要'],
        publishedAt: new Date('2024-01-13T14:20:00Z').toISOString(),
        createdAt: new Date('2024-01-13T14:00:00Z').toISOString()
      }
    ]

    // 模拟分页
    const total = mockNews.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const currentNews = mockNews.slice(startIndex, endIndex)

    return createSuccessResponse({
      list: currentNews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, '获取资讯列表成功')

  } catch (error) {
    console.error('获取资讯列表错误:', error)
    return createErrorResponse('获取资讯列表失败')
  }
}

// 直接导出处理函数，无需认证
export const GET = getNews 