import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'
import { checkPermission, PERMISSIONS } from '../../../../lib/permissionMiddleware.js'

// 获取单个轮播图详情
export async function GET(request, { params }) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return authResult

    // 权限检查
    const permissionError = checkPermission(authResult, PERMISSIONS.BANNER_VIEW, '查看轮播图详情')
    if (permissionError) return permissionError
    
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
    if (authResult?.error) return authResult

    // 权限检查
    const permissionError = checkPermission(authResult, PERMISSIONS.BANNER_UPDATE, '更新轮播图')
    if (permissionError) return permissionError
    
    const { id } = await params
    const body = await request.json()
    const { title, imageUrl, linkUrl, position, sort, isActive, textColor, startTime, endTime } = body
    
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
    
    // 验证位置字段
    if (position && !['top', 'middle', 'bottom'].includes(position)) {
      return NextResponse.json({
        success: false,
        message: '位置必须是 top、middle 或 bottom'
      }, { status: 400 })
    }
    
    // 更新轮播图
    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        imageUrl,
        linkUrl,
        position,
        sort,
        isActive,
        textColor,
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
    if (authResult?.error) return authResult

    // 权限检查
    const permissionError = checkPermission(authResult, PERMISSIONS.BANNER_DELETE, '删除轮播图')
    if (permissionError) return permissionError
    
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