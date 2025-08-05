import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取优惠券列表
export async function GET(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const name = searchParams.get('name') || ''
    const channel = searchParams.get('channel') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const targetUsers = searchParams.get('targetUsers') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {}
    
    if (name) {
      where.name = { contains: name, mode: 'insensitive' }
    }
    
    if (channel) {
      where.channel = channel
    }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (targetUsers) {
      where.targetUsers = targetUsers
    }

    // 查询数据
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.coupon.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: coupons,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建优惠券
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

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
      channel = 'all',
      targetUsers = 'all',
      status = 'pending',
      description,
      isActive = true
    } = body

    // 验证必填字段
    if (!name || !code || !type || !value || !totalCount || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: '名称、代码、类型、面值、总数量、开始时间和结束时间是必填字段' },
        { status: 400 }
      )
    }

    // 验证优惠券代码唯一性
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    })

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: '优惠券代码已存在' },
        { status: 409 }
      )
    }

    // 验证时间
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { success: false, message: '开始时间必须早于结束时间' },
        { status: 400 }
      )
    }

    // 验证类型
    const validTypes = ['discount', 'free']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的优惠券类型' },
        { status: 400 }
      )
    }

    // 验证渠道
    const validChannels = ['all', 'wechat', 'app', 'website', 'offline', 'partner']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { success: false, message: '无效的发放渠道' },
        { status: 400 }
      )
    }

    // 验证目标用户
    const validTargetUsers = ['all', 'vip', 'enterprise', 'normal', 'new']
    if (!validTargetUsers.includes(targetUsers)) {
      return NextResponse.json(
        { success: false, message: '无效的目标用户' },
        { status: 400 }
      )
    }

    // 验证状态
    const validStatuses = ['pending', 'active', 'expired', 'paused', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: '无效的状态' },
        { status: 400 }
      )
    }

    // 数据类型转换
    const numericValue = parseFloat(value)
    const numericMinAmount = minAmount ? parseFloat(minAmount) : null
    const numericMaxDiscount = maxDiscount ? parseFloat(maxDiscount) : null
    const numericTotalCount = parseInt(totalCount)

    // 验证数值字段
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json(
        { success: false, message: '面值必须是大于0的数字' },
        { status: 400 }
      )
    }

    if (numericMinAmount !== null && (isNaN(numericMinAmount) || numericMinAmount < 0)) {
      return NextResponse.json(
        { success: false, message: '最低消费金额必须是大于等于0的数字' },
        { status: 400 }
      )
    }

    if (numericMaxDiscount !== null && (isNaN(numericMaxDiscount) || numericMaxDiscount < 0)) {
      return NextResponse.json(
        { success: false, message: '最大折扣金额必须是大于等于0的数字' },
        { status: 400 }
      )
    }

    if (isNaN(numericTotalCount) || numericTotalCount <= 0) {
      return NextResponse.json(
        { success: false, message: '总数量必须是大于0的整数' },
        { status: 400 }
      )
    }

    // 创建优惠券
    const coupon = await prisma.coupon.create({
      data: {
        name,
        code,
        type,
        value: numericValue,
        minAmount: numericMinAmount,
        maxDiscount: numericMaxDiscount,
        totalCount: numericTotalCount,
        startTime: start,
        endTime: end,
        channel,
        targetUsers,
        status,
        description,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: '优惠券创建成功',
      data: coupon
    }, { status: 201 })
  } catch (error) {
    console.error('创建优惠券失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 