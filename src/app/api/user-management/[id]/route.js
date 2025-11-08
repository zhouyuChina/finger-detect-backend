import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个用户信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        status: true,
        age: true,
        gender: true,
        address: true,
        userId: true,
        archives: true,
        photos: true,
        reports: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        remark: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新用户信息
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
      username,
      realName,
      phone,
      email,
      age,
      gender,
      address,
      userId,
      status,
      remark
    } = body

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 如果修改用户名，检查是否与其他用户冲突
    if (username && username !== existingUser.username) {
      const duplicateUser = await prisma.user.findFirst({
        where: { 
          username,
          id: { not: id }
        }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, message: '用户名已存在' },
          { status: 400 }
        )
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        realName,
        phone,
        email,
        age,
        gender,
        address,
        userId,
        status,
        remark
      },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        status: true,
        age: true,
        gender: true,
        address: true,
        userId: true,
        archives: true,
        photos: true,
        reports: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        remark: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除子用户及其所有关联数据
export async function DELETE(request, { params }) {
  let prisma = null
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    prisma = new PrismaClient()

    // 检查子用户是否存在，并获取关联数据统计
    const existingUser = await prisma.subUser.findUnique({
      where: { id },
      include: {
        wechatUser: {
          select: {
            nickname: true,
            openid: true
          }
        },
        _count: {
          select: {
            detections: true,
            userCoupons: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取档案数量（需要单独查询）
    const archiveCount = await prisma.archive.count({
      where: { subUserId: id }
    })

    // 删除子用户（会级联删除：detections, archives, userCoupons）
    await prisma.subUser.delete({
      where: { id }
    })

    console.log(`✅ 已删除子用户: ${existingUser.username || existingUser.realName}`)
    console.log(`   - 所属微信用户: ${existingUser.wechatUser?.nickname || existingUser.wechatUser?.openid}`)
    console.log(`   - 检测记录: ${existingUser._count.detections} 条已删除`)
    console.log(`   - 档案: ${archiveCount} 个已删除`)
    console.log(`   - 优惠券: ${existingUser._count.userCoupons} 个已删除`)

    return NextResponse.json({
      success: true,
      message: '用户及所有关联数据删除成功',
      data: {
        deletedUser: existingUser.username || existingUser.realName,
        deletedDetections: existingUser._count.detections,
        deletedArchives: archiveCount,
        deletedCoupons: existingUser._count.userCoupons
      }
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
} 