import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 保存资讯阅读记录
async function saveReadRecord(request) {
  try {
    const { newsId } = await request.json()
    
    if (!newsId) {
      return createErrorResponse('缺少资讯ID', 400)
    }

    // 从认证中间件获取用户信息
    const userId = request.user.id
    const userOpenid = request.user.openid

    console.log('保存阅读记录:', {
      userId,
      userOpenid,
      newsId,
      readTime: new Date().toISOString()
    })

    // TODO: 保存阅读记录到数据库
    // const readRecord = await prisma.newsReadRecord.create({
    //   data: {
    //     userId: userId,
    //     userOpenid: userOpenid,
    //     newsId: newsId,
    //     readTime: new Date(),
    //     ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    //     userAgent: request.headers.get('user-agent') || 'unknown'
    //   }
    // })

    // TODO: 更新资讯的阅读次数
    // await prisma.news.update({
    //   where: { id: parseInt(newsId) },
    //   data: {
    //     readCount: {
    //       increment: 1
    //     }
    //   }
    // })

    // 模拟保存成功
    const mockReadRecord = {
      id: Date.now(),
      userId: userId,
      userOpenid: userOpenid,
      newsId: newsId,
      readTime: new Date().toISOString(),
      ip: '127.0.0.1',
      userAgent: 'WeChat Mini Program'
    }

    return createSuccessResponse(mockReadRecord, '阅读记录保存成功')

  } catch (error) {
    console.error('保存阅读记录错误:', error)
    return createErrorResponse('保存阅读记录失败')
  }
}

// 获取用户的阅读记录列表
async function getReadRecords(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    
    // 从认证中间件获取用户信息
    const userId = request.user.id
    const userOpenid = request.user.openid

    // TODO: 从数据库获取用户的阅读记录
    // const where = {
    //   userId: userId
    // }
    // 
    // const [readRecords, total] = await Promise.all([
    //   prisma.newsReadRecord.findMany({
    //     where,
    //     skip: (page - 1) * limit,
    //     take: limit,
    //     orderBy: { readTime: 'desc' },
    //     include: {
    //       news: {
    //         select: {
    //           id: true,
    //           title: true,
    //           summary: true,
    //           coverImage: true,
    //           category: true,
    //           publishedAt: true
    //         }
    //       }
    //     }
    //   }),
    //   prisma.newsReadRecord.count({ where })
    // ])

    // 模拟数据
    const mockReadRecords = [
      {
        id: 1,
        newsId: 1,
        readTime: new Date('2024-01-15T14:30:00Z').toISOString(),
        news: {
          id: 1,
          title: '指纹检测技术最新进展',
          summary: '随着人工智能技术的发展，指纹检测技术取得了重大突破...',
          coverImage: '/uploads/1753695692581_bx6dkiv1bbn.png',
          category: '技术资讯',
          publishedAt: new Date('2024-01-15T10:00:00Z').toISOString()
        }
      },
      {
        id: 2,
        newsId: 2,
        readTime: new Date('2024-01-14T16:45:00Z').toISOString(),
        news: {
          id: 2,
          title: '系统维护通知',
          summary: '为了提供更好的服务体验，系统将于本周日进行维护升级...',
          coverImage: '/uploads/1753694778560_amo65patk7e.png',
          category: '系统通知',
          publishedAt: new Date('2024-01-14T15:30:00Z').toISOString()
        }
      }
    ]

    // 模拟分页
    const total = mockReadRecords.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const currentRecords = mockReadRecords.slice(startIndex, endIndex)

    return createSuccessResponse({
      list: currentRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, '获取阅读记录成功')

  } catch (error) {
    console.error('获取阅读记录错误:', error)
    return createErrorResponse('获取阅读记录失败')
  }
}

// 使用中间件包装处理函数
export const POST = miniprogramAuthMiddleware(saveReadRecord)
export const GET = miniprogramAuthMiddleware(getReadRecords) 