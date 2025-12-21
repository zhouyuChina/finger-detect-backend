import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'
import { checkPermission, PERMISSIONS } from '../../../lib/permissionMiddleware.js'

// 获取轮播图列表（公开接口，无需认证）
export async function GET(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const isActive = searchParams.get('isActive')
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {}
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    // 位置筛选已取消，返回全部位置
    
    // 查询轮播图
    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take,
        orderBy: [
          { sort: 'asc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.banner.count({ where })
    ])
    
    const response = createPaginatedResponse(banners, total, page, limit)
    return wrapResponse(response, '获取轮播图列表成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建轮播图
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查
    const permissionError = checkPermission(authResult, PERMISSIONS.BANNER_CREATE, '创建轮播图')
    if (permissionError) return permissionError
    
    const body = await request.json()
    const { title, imageUrl, linkUrl, position, sort, isActive, textColor, startTime, endTime } = body
    
    // 验证必填字段
    if (!title || !imageUrl) {
      return NextResponse.json({
        success: false,
        message: '标题和图片URL是必填字段'
      }, { status: 400 })
    }
    
    // 验证位置字段
    if (position && !['top', 'middle', 'bottom'].includes(position)) {
      return NextResponse.json({
        success: false,
        message: '位置必须是 top、middle 或 bottom'
      }, { status: 400 })
    }
    
    // 创建轮播图
    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl,
        position: position || 'middle',
        sort: sort || 0,
        isActive: isActive !== undefined ? isActive : true,
        textColor: textColor || '#FFFFFF',
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null
      }
    })
    
    return wrapResponse(banner, '轮播图创建成功', 201)
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 