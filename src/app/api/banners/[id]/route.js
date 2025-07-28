import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'

// 获取单个轮播图详情
export async function GET(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = await params
    
    const banner = await prisma.banner.findUnique({
      where: { id }
    })
    
    if (!banner) {
      return NextResponse.json({
        success: false,
        message: '轮播图不存在'
      }, { status: 404 })
    }
    
    return wrapResponse(banner, '获取轮播图详情成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 更新轮播图
export async function PUT(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = await params
    const body = await request.json()
    const { title, imageUrl, linkUrl, sort, isActive, startTime, endTime } = body
    
    // 检查轮播图是否存在
    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    })
    
    if (!existingBanner) {
      return NextResponse.json({
        success: false,
        message: '轮播图不存在'
      }, { status: 404 })
    }
    
    // 更新轮播图
    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        imageUrl,
        linkUrl,
        sort,
        isActive,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null
      }
    })
    
    return wrapResponse(updatedBanner, '轮播图更新成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 删除轮播图
export async function DELETE(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 30, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { id } = await params
    
    // 检查轮播图是否存在
    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    })
    
    if (!existingBanner) {
      return NextResponse.json({
        success: false,
        message: '轮播图不存在'
      }, { status: 404 })
    }
    
    // 删除轮播图
    await prisma.banner.delete({
      where: { id }
    })
    
    return wrapResponse(null, '轮播图删除成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 