import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'

// 获取反馈列表
export async function GET(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const userId = searchParams.get('userId') || ''
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {}
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (userId) {
      where.userId = userId
    }
    
    // 查询反馈
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true
            }
          }
        }
      }),
      prisma.feedback.count({ where })
    ])
    
    const response = createPaginatedResponse(feedbacks, total, page, limit)
    return wrapResponse(response, '获取反馈列表成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建反馈
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 20, 60) // 用户反馈限制更严格
    if (rateLimitResult) return rateLimitResult
    
    const body = await request.json()
    const { userId, type, title, content, images } = body
    
    // 验证必填字段
    if (!userId || !type || !title || !content) {
      return NextResponse.json({
        success: false,
        message: '用户ID、类型、标题和内容是必填字段'
      }, { status: 400 })
    }
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }
    
    // 验证反馈类型
    const validTypes = ['bug', 'suggestion', 'complaint']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: '无效的反馈类型'
      }, { status: 400 })
    }
    
    // 创建反馈
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        title,
        content,
        images: images || []
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    })
    
    return wrapResponse(feedback, '反馈提交成功', 201)
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 