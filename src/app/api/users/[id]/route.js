import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'

// 获取单个用户详情
export async function GET(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        detections: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        feedbacks: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            detections: true,
            feedbacks: true,
            coupons: true
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }
    
    return wrapResponse(user, '获取用户详情成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 更新用户信息
export async function PUT(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = params
    const body = await request.json()
    const { nickname, avatar, phone, gender, city, province, country, isActive } = body
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }
    
    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nickname,
        avatar,
        phone,
        gender,
        city,
        province,
        country,
        isActive
      }
    })
    
    return wrapResponse(updatedUser, '用户信息更新成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 删除用户（软删除）
export async function DELETE(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 30, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = params
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }
    
    // 软删除用户
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
    
    return wrapResponse(null, '用户删除成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 