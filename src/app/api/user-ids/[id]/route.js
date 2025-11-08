import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

// 获取单个ID记录
export async function GET(request, { params }) {
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

    const userIdRecord = await prisma.wechatUserVerification.findUnique({
      where: { id },
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
            openid: true
          }
        },
        verifyAdmin: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!userIdRecord) {
      return NextResponse.json(
        { success: false, message: 'ID记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userIdRecord
    })
  } catch (error) {
    console.error('获取ID记录失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// 更新ID记录
export async function PUT(request, { params }) {
  let prisma = null
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
      idNumber,
      realName,
      idCardFront,
      idCardBack,
      idCardHand,
      verifyStatus,
      rejectReason
    } = body

    prisma = new PrismaClient()

    // 检查记录是否存在
    const existingRecord = await prisma.wechatUserVerification.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: 'ID记录不存在' },
        { status: 404 }
      )
    }

    // 更新数据
    const updateData = {}
    if (idNumber !== undefined) updateData.idNumber = idNumber
    if (realName !== undefined) updateData.realName = realName
    if (idCardFront !== undefined) updateData.idCardFront = idCardFront
    if (idCardBack !== undefined) updateData.idCardBack = idCardBack
    if (idCardHand !== undefined) updateData.idCardHand = idCardHand
    if (verifyStatus !== undefined) {
      updateData.verifyStatus = verifyStatus
      if (verifyStatus === 'verified') {
        updateData.verifyTime = new Date()
        updateData.verifyAdminId = authResult.id
      } else if (verifyStatus === 'rejected') {
        updateData.rejectReason = rejectReason
        updateData.verifyTime = new Date()
        updateData.verifyAdminId = authResult.id
      }
    }

    const updatedRecord = await prisma.wechatUserVerification.update({
      where: { id },
      data: updateData,
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        verifyAdmin: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ID记录更新成功',
      data: updatedRecord
    })
  } catch (error) {
    console.error('更新ID记录失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// 删除ID记录
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

    // 检查记录是否存在
    const existingRecord = await prisma.wechatUserVerification.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: 'ID记录不存在' },
        { status: 404 }
      )
    }

    // 删除记录
    await prisma.wechatUserVerification.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ID记录删除成功'
    })
  } catch (error) {
    console.error('删除ID记录失败:', error)
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