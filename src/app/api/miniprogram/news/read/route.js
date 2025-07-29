import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 标记资讯为已读
async function markAsRead(request) {
  try {
    const { articleId } = await request.json()
    
    if (!articleId) {
      return createErrorResponse('缺少资讯ID', 400)
    }

    // 从认证中间件获取用户信息
    const userId = request.user.id

    console.log('标记资讯已读:', {
      userId,
      articleId,
      readAt: new Date().toISOString()
    })

    // TODO: 保存或更新用户阅读状态到数据库
    // const readStatus = await prisma.userReadStatus.upsert({
    //   where: {
    //     userId_articleId: {
    //       userId: userId,
    //       articleId: parseInt(articleId)
    //     }
    //   },
    //   update: {
    //     isRead: true,
    //     readAt: new Date()
    //   },
    //   create: {
    //     userId: userId,
    //     articleId: parseInt(articleId),
    //     isRead: true,
    //     readAt: new Date()
    //   }
    // })

    // 模拟保存成功
    const mockReadStatus = {
      id: Date.now(),
      userId: userId,
      articleId: parseInt(articleId),
      isRead: true,
      readAt: new Date().toISOString()
    }

    return createSuccessResponse(mockReadStatus, '标记已读成功')

  } catch (error) {
    console.error('标记已读错误:', error)
    return createErrorResponse('标记已读失败')
  }
}

// 获取用户对指定资讯的阅读状态
async function getReadStatus(request) {
  try {
    const { searchParams } = new URL(request.url)
    const articleIds = searchParams.get('articleIds') // 支持多个资讯ID，用逗号分隔
    
    if (!articleIds) {
      return createErrorResponse('缺少资讯ID列表', 400)
    }

    // 从认证中间件获取用户信息
    const userId = request.user.id
    const articleIdList = articleIds.split(',').map(id => parseInt(id.trim()))

    console.log('获取阅读状态:', {
      userId,
      articleIds: articleIdList
    })

    // TODO: 从数据库获取用户的阅读状态
    // const readStatuses = await prisma.userReadStatus.findMany({
    //   where: {
    //     userId: userId,
    //     articleId: {
    //       in: articleIdList
    //     }
    //   },
    //   select: {
    //     articleId: true,
    //     isRead: true,
    //     readAt: true
    //   }
    // })

    // 模拟数据 - 返回每个资讯的阅读状态
    const mockReadStatuses = articleIdList.map(articleId => ({
      articleId: articleId,
      isRead: Math.random() > 0.5, // 随机模拟已读/未读状态
      readAt: Math.random() > 0.5 ? new Date().toISOString() : null
    }))

    return createSuccessResponse(mockReadStatuses, '获取阅读状态成功')

  } catch (error) {
    console.error('获取阅读状态错误:', error)
    return createErrorResponse('获取阅读状态失败')
  }
}

// 使用中间件包装处理函数
export const POST = miniprogramAuthMiddleware(markAsRead)
export const GET = miniprogramAuthMiddleware(getReadStatus) 