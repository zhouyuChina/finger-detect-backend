import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware } from '../../../../../src/lib/middleware.js'
import { miniprogramAuthMiddleware } from '../../../../../src/lib/miniprogramAuth.js'

const prisma = new PrismaClient()

// 获取当前用户可用的优惠券信息
async function getCoupons(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') || '' // 可选：used, unused, expired

    const now = new Date()

    // 获取用户信息 - 从认证中间件获取
    const wechatUser = await prisma.wechatUser.findFirst({
      where: { openid: request.user.openid }
    })

    let userCoupons = []
    let currentSubUser = null

    if (wechatUser) {
      // 获取用户的子用户
      const subUsers = await prisma.subUser.findMany({
        where: { wechatUserId: wechatUser.id }
      })

      if (subUsers.length > 0) {
        // 使用第一个子用户作为当前用户
        currentSubUser = subUsers[0]

        console.log('🔍 查询优惠券 - 用户ID:', currentSubUser.id)

        // 查询用户已拥有的优惠券
        userCoupons = await prisma.userCoupon.findMany({
          where: {
            subUserId: currentSubUser.id
          },
          include: {
            coupon: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
                value: true,
                minAmount: true,
                maxDiscount: true,
                startTime: true,
                endTime: true,
                description: true,
                status: true,
                targetUsers: true
              }
            }
          }
        })

        console.log('👤 用户已拥有优惠券数量:', userCoupons.length)
      }
    } else {
      console.log('⚠️ 用户不存在，只返回可用优惠券')
    }

    // 查询所有可用的优惠券
    const availableCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        status: 'active',
        startTime: { lte: now },
        endTime: { gte: now },
        OR: [
          { channel: 'all' },
          { channel: 'wechat' }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        value: true,
        minAmount: true,
        maxDiscount: true,
        startTime: true,
        endTime: true,
        description: true,
        status: true,
        targetUsers: true
      }
    })

    console.log('📋 可用优惠券数量:', availableCoupons.length)

    // 处理数据，添加状态信息
    let processedData = []

    // 处理已拥有的优惠券
    const ownedCoupons = userCoupons.map(userCoupon => {
      const coupon = userCoupon.coupon
      let status = 'unused'
      
      if (userCoupon.isUsed) {
        status = 'used'
      } else if (now > coupon.endTime) {
        status = 'expired'
      }

      return {
        id: userCoupon.id,
        couponId: userCoupon.couponId,
        isUsed: userCoupon.isUsed,
        usedAt: userCoupon.usedAt,
        createdAt: userCoupon.createdAt,
        status: status,
        isOwned: true,
        coupon: {
          ...coupon,
          isExpired: now > coupon.endTime,
          isActive: now >= coupon.startTime && now <= coupon.endTime && coupon.status === 'active'
        }
      }
    })

    // 处理可用的优惠券（未拥有的）
    const ownedCouponIds = userCoupons.map(uc => uc.couponId)
    const availableNotOwned = availableCoupons
      .filter(coupon => !ownedCouponIds.includes(coupon.id))
      .map(coupon => ({
        id: null,
        couponId: coupon.id,
        isUsed: false,
        usedAt: null,
        createdAt: null,
        status: 'available',
        isOwned: false,
        coupon: {
          ...coupon,
          isExpired: now > coupon.endTime,
          isActive: now >= coupon.startTime && now <= coupon.endTime && coupon.status === 'active'
        }
      }))

    // 合并数据
    processedData = [...ownedCoupons, ...availableNotOwned]

    console.log('📊 处理后的数据数量:', processedData.length)

    // 根据状态筛选
    if (status === 'used') {
      processedData = processedData.filter(item => item.status === 'used')
    } else if (status === 'unused') {
      // 未使用的优惠券包括：用户拥有的未使用优惠券 + 可领取的优惠券
      processedData = processedData.filter(item => item.status === 'unused' || item.status === 'available')
    } else if (status === 'expired') {
      processedData = processedData.filter(item => item.status === 'expired')
    } else if (status === 'available') {
      processedData = processedData.filter(item => item.status === 'available')
    }

    // 计算分页
    const total = processedData.length
    const totalPages = Math.ceil(total / pageSize)
    const skip = (page - 1) * pageSize
    const paginatedData = processedData.slice(skip, skip + pageSize)

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    console.error('获取用户优惠券失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 导出使用认证中间件的GET方法
export const GET = miniprogramAuthMiddleware(getCoupons) 