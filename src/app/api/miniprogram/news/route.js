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
    const isTop = searchParams.get('isTop')
    const types = searchParams.get('types')
    
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
    
    // 处理置顶筛选
    if (isTop === 'true') {
      where.types = {
        has: '置顶'
      }
    }
    
    // 处理types筛选
    if (types) {
      try {
        const typesArray = JSON.parse(decodeURIComponent(types))
        if (Array.isArray(typesArray) && typesArray.length > 0) {
          where.types = {
            hasSome: typesArray
          }
        }
      } catch (error) {
        console.log('解析types参数失败:', error.message)
      }
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
          types: true,
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
      types: item.types || [], // 返回实际的types字段
      readCount: item.viewCount || 0, // 兼容字段名
      publishedAt: item.publishedAt?.toISOString(),
      createdAt: item.createdAt?.toISOString()
    }))
    
    // 对结果进行排序：置顶的排在前面
    processedNews.sort((a, b) => {
      const aIsTop = a.types.includes('置顶')
      const bIsTop = b.types.includes('置顶')
      
      if (aIsTop && !bIsTop) return -1
      if (!aIsTop && bIsTop) return 1
      
      // 如果都是置顶或都不是置顶，按发布时间排序
      return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
    })

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