import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取用户未读文章数量
async function getUnreadCount(request) {
  let prisma = null
  try {
    // 从认证中间件获取用户信息
    const userId = request.user.id

    console.log('获取未读文章数量:', { userId })

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取所有已发布的文章
    const totalArticles = await prisma.news.count({
      where: {
        isPublished: true
      }
    })

    // 获取用户已读的文章数量
    const readArticles = await prisma.userReadStatus.count({
      where: {
        userId: userId,
        isRead: true
      }
    })

    const unreadCount = totalArticles - readArticles

    return createSuccessResponse({
      unreadCount: Math.max(0, unreadCount), // 确保不为负数
      totalArticles: totalArticles,
      readArticles: readArticles
    }, '获取未读数量成功')

  } catch (error) {
    console.error('获取未读数量错误:', error)
    return createErrorResponse('获取未读数量失败')
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
export const GET = miniprogramAuthMiddleware(getUnreadCount) 