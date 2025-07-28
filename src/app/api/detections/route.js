import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'

// 获取检测记录列表
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
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {}
    
    if (status) {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }
    
    // 查询检测记录
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
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
      prisma.detection.count({ where })
    ])
    
    const response = createPaginatedResponse(detections, total, page, limit)
    return wrapResponse(response, '获取检测记录成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建检测记录
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    const body = await request.json()
    const { userId, imageUrl, result, confidence } = body
    
    // 验证必填字段
    if (!userId || !imageUrl) {
      return NextResponse.json({
        success: false,
        message: 'userId和imageUrl是必填字段'
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
    
    // 创建检测记录
    const detection = await prisma.detection.create({
      data: {
        userId,
        imageUrl,
        result: result || '{}',
        confidence: confidence || 0,
        status: 'pending'
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
    
    return wrapResponse(detection, '检测记录创建成功', 201)
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 