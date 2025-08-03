import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取资讯列表（小程序专用）- 公开接口，无需认证
async function getNews(request) {
  let prisma = null
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()
    
    // 构建查询条件
    const where = {
      isPublished: true
    }
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // 从数据库获取已发布的资讯
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          summary: true,
          coverImage: true,
          author: true,
          category: true,
          tags: true,
          viewCount: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true
        }
      }),
      prisma.news.count({ where })
    ])

    // 处理数据格式，兼容前端期望的字段名
    const processedNews = news.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      coverImage: item.coverImage,
      author: item.author,
      category: item.category,
      tags: item.tags || [],
      readCount: item.viewCount || 0, // 兼容字段名
      types: [], // 暂时为空数组，后续可以添加类型字段
      publishedAt: item.publishedAt?.toISOString(),
      createdAt: item.createdAt?.toISOString()
    }))

    const totalPages = Math.ceil(total / limit)

    return createSuccessResponse({
      list: processedNews,
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
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 直接导出处理函数，无需认证
export const GET = getNews 