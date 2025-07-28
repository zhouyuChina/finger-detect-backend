import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { rateLimitMiddleware, adminAuthMiddleware } from '@/lib/middleware'

const prisma = new PrismaClient()

// 获取单个ID记录
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const userIdRecord = await prisma.userId.findUnique({
      where: { id },
      include: {
        user: {
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
  }
}

// 更新ID记录
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
      idNumber,
      realName,
      idCardFront,
      idCardBack,
      idCardHand,
      verifyStatus,
      rejectReason
    } = body

    // 检查记录是否存在
    const existingRecord = await prisma.userId.findUnique({
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

    const updatedRecord = await prisma.userId.update({
      where: { id },
      data: updateData,
      include: {
        user: {
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
  }
}

// 删除ID记录
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查记录是否存在
    const existingRecord = await prisma.userId.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: 'ID记录不存在' },
        { status: 404 }
      )
    }

    // 删除记录
    await prisma.userId.delete({
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
  }
} 