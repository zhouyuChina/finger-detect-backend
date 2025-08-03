import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 一键标记所有文章为已读
async function markAllAsRead(request) {
  let prisma = null
  try {
    // 从认证中间件获取用户信息
    const userId = request.user.id

    console.log('一键标记所有文章已读:', {
      userId,
      readAt: new Date().toISOString()
    })

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取所有已发布的文章
    const allArticles = await prisma.news.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true
      }
    })

    if (allArticles.length === 0) {
      return createSuccessResponse({ 
        markedCount: 0,
        totalArticles: 0
      }, '没有可标记的文章')
    }

    // 批量创建或更新阅读状态
    const readStatuses = []
    const now = new Date()

    for (const article of allArticles) {
      const readStatus = await prisma.userReadStatus.upsert({
        where: {
          userId_articleId: {
            userId: userId,
            articleId: article.id
          }
        },
        update: {
          isRead: true,
          readAt: now
        },
        create: {
          userId: userId,
          articleId: article.id,
          isRead: true,
          readAt: now
        }
      })
      readStatuses.push(readStatus)
    }

    return createSuccessResponse({
      markedCount: readStatuses.length,
      totalArticles: allArticles.length,
      message: `成功标记 ${readStatuses.length} 篇文章为已读`
    }, '一键已读操作成功')

  } catch (error) {
    console.error('一键已读错误:', error)
    return createErrorResponse('一键已读操作失败')
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

// 使用中间件包装处理函数
export const POST = miniprogramAuthMiddleware(markAllAsRead) 