import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取新闻详情
async function getNewsDetail(request, { params }) {
  let prisma = null
  try {
    const { id } = params
    
    if (!id) {
      return createErrorResponse('缺少新闻ID参数', 400)
    }

    console.log('获取新闻详情:', { id })

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取新闻详情
    const news = await prisma.news.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        coverImage: true,
        author: true,
        category: true,
        tags: true,
        viewCount: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!news) {
      return createErrorResponse('新闻不存在', 404)
    }

    if (!news.isPublished) {
      return createErrorResponse('新闻未发布', 404)
    }

    // 增加浏览量
    await prisma.news.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    // 处理数据格式，兼容前端期望的字段名
    const processedNews = {
      id: news.id,
      title: news.title,
      content: news.content,
      summary: news.summary,
      coverImage: news.coverImage,
      author: news.author,
      category: news.category,
      tags: news.tags || [],
      readCount: news.viewCount, // 兼容字段名
      isPublished: news.isPublished,
      publishedAt: news.publishedAt?.toISOString(),
      createdAt: news.createdAt?.toISOString(),
      updatedAt: news.updatedAt?.toISOString()
    }

    return createSuccessResponse(processedNews, '获取新闻详情成功')

  } catch (error) {
    console.error('获取新闻详情错误:', error)
    return createErrorResponse('获取新闻详情失败')
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 直接导出处理函数，无需认证（公开接口）
export const GET = getNewsDetail 