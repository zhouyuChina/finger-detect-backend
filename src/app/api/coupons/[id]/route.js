import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个优惠券信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userCoupons: true
          }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: '优惠券不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon
    })
  } catch (error) {
    console.error('获取优惠券信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新优惠券信息
export async function PUT(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params
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
      channel,
      targetUsers,
      status,
      description,
      isActive
    } = body

    // 检查优惠券是否存在
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, message: '优惠券不存在' },
        { status: 404 }
      )
    }

    // 如果修改了代码，检查唯一性
    if (code && code !== existingCoupon.code) {
      const duplicateCode = await prisma.coupon.findUnique({
        where: { code }
      })
      
      if (duplicateCode) {
        return NextResponse.json(
          { success: false, message: '优惠券代码已存在' },
          { status: 409 }
        )
      }
    }

    // 验证时间
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      
      if (start >= end) {
        return NextResponse.json(
          { success: false, message: '开始时间必须早于结束时间' },
          { status: 400 }
        )
      }
    }

    // 更新优惠券信息
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        name,
        code,
        type,
        value,
        minAmount,
        maxDiscount,
        totalCount,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        channel,
        targetUsers,
        status,
        description,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: '优惠券信息更新成功',
      data: updatedCoupon
    })
  } catch (error) {
    console.error('更新优惠券信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除优惠券
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查优惠券是否存在
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, message: '优惠券不存在' },
        { status: 404 }
      )
    }

    // 删除优惠券
    await prisma.coupon.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '优惠券删除成功'
    })
  } catch (error) {
    console.error('删除优惠券失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  }
} 