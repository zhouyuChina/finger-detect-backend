import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'

// 获取优惠券列表
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
    const isActive = searchParams.get('isActive')
    const type = searchParams.get('type') || ''
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {}
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    
    if (type) {
      where.type = type
    }
    
    // 查询优惠券
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              userCoupons: true
            }
          }
        }
      }),
      prisma.coupon.count({ where })
    ])
    
    const response = createPaginatedResponse(coupons, total, page, limit)
    return wrapResponse(response, '获取优惠券列表成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建优惠券
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const body = await request.json()
    const { 
      name, 
      code, 
      type, 
      value, 
      minAmount, 
      maxDiscount, 
      totalCount, 
      startTime, 
      endTime, 
      isActive 
    } = body
    
    // 验证必填字段
    if (!name || !code || !type || !value || !totalCount || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        message: '名称、代码、类型、面值、总数量、开始时间和结束时间是必填字段'
      }, { status: 400 })
    }
    
    // 验证优惠券代码唯一性
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    })
    
    if (existingCoupon) {
      return NextResponse.json({
        success: false,
        message: '优惠券代码已存在'
      }, { status: 409 })
    }
    
    // 验证时间
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (start >= end) {
      return NextResponse.json({
        success: false,
        message: '开始时间必须早于结束时间'
      }, { status: 400 })
    }
    
    // 验证类型
    const validTypes = ['discount', 'free']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: '无效的优惠券类型'
      }, { status: 400 })
    }
    
    // 创建优惠券
    const coupon = await prisma.coupon.create({
      data: {
        name,
        code,
        type,
        value,
        minAmount,
        maxDiscount,
        totalCount,
        startTime: start,
        endTime: end,
        isActive: isActive !== undefined ? isActive : true
      }
    })
    
    return wrapResponse(coupon, '优惠券创建成功', 201)
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 