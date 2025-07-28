import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'

// 获取用户列表
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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {
      isActive: true
    }
    
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.isActive = status === 'active'
    }
    
    // 查询用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          openid: true,
          nickname: true,
          avatar: true,
          phone: true,
          gender: true,
          city: true,
          province: true,
          country: true,
          createdAt: true,
          isActive: true,
          _count: {
            select: {
              detections: true,
              feedbacks: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])
    
    const response = createPaginatedResponse(users, total, page, limit)
    return wrapResponse(response, '获取用户列表成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建用户
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const body = await request.json()
    const { openid, nickname, avatar, phone, gender, city, province, country } = body
    
    // 验证必填字段
    if (!openid) {
      return NextResponse.json({
        success: false,
        message: 'openid是必填字段'
      }, { status: 400 })
    }
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { openid }
    })
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: '用户已存在'
      }, { status: 409 })
    }
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        openid,
        nickname,
        avatar,
        phone,
        gender,
        city,
        province,
        country
      }
    })
    
    return wrapResponse(user, '用户创建成功', 201)
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 