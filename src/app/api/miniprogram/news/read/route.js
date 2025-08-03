import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 标记资讯为已读
async function markAsRead(request) {
  let prisma = null
  try {
    const { articleId } = await request.json()
    
    if (!articleId) {
      return createErrorResponse('缺少资讯ID参数', 400)
    }

    // 从认证中间件获取用户信息
    const userId = request.user.id

    console.log('标记资讯已读:', {
      userId,
      articleId,
      readAt: new Date().toISOString()
    })

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 验证文章是否存在
    const article = await prisma.news.findUnique({
      where: { id: articleId },
      select: { id: true, title: true }
    })

    if (!article) {
      return createErrorResponse(`文章ID ${articleId} 不存在`, 404)
    }

    // 保存或更新用户阅读状态到数据库
    const readStatus = await prisma.userReadStatus.upsert({
      where: {
        userId_articleId: {
          userId: userId,
          articleId: articleId
        }
      },
      update: {
        isRead: true,
        readAt: new Date()
      },
      create: {
        userId: userId,
        articleId: articleId,
        isRead: true,
        readAt: new Date()
      }
    })

    return createSuccessResponse(readStatus, '标记已读成功')

  } catch (error) {
    console.error('标记已读错误:', error)
    return createErrorResponse('标记已读失败')
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

// 获取用户对指定资讯的阅读状态
async function getReadStatus(request) {
  let prisma = null
  try {
    const { searchParams } = new URL(request.url)
    const articleIds = searchParams.get('articleIds') // 支持多个资讯ID，用逗号分隔
    
    if (!articleIds) {
      return createErrorResponse('缺少articleIds参数，请提供要查询的文章ID列表（用逗号分隔）', 400)
    }

    // 从认证中间件获取用户信息
    const userId = request.user.id
    const articleIdList = articleIds.split(',').map(id => id.trim()).filter(id => id.length > 0)

    if (articleIdList.length === 0) {
      return createErrorResponse('articleIds参数格式错误，请提供有效的文章ID（用逗号分隔）', 400)
    }

    console.log('获取阅读状态:', {
      userId,
      articleIds: articleIdList
    })

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 从数据库获取用户的阅读状态
    const readStatuses = await prisma.userReadStatus.findMany({
      where: {
        userId: userId,
        articleId: {
          in: articleIdList
        }
      },
      select: {
        articleId: true,
        isRead: true,
        readAt: true
      }
    })

    // 为所有请求的文章ID返回状态，未读的文章返回默认状态
    const result = articleIdList.map(articleId => {
      const existingStatus = readStatuses.find(status => status.articleId === articleId)
      return {
        articleId: articleId,
        isRead: existingStatus ? existingStatus.isRead : false,
        readAt: existingStatus ? existingStatus.readAt : null
      }
    })

    return createSuccessResponse(result, '获取阅读状态成功')

  } catch (error) {
    console.error('获取阅读状态错误:', error)
    return createErrorResponse('获取阅读状态失败')
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
export const POST = miniprogramAuthMiddleware(markAsRead)
export const GET = miniprogramAuthMiddleware(getReadStatus) 