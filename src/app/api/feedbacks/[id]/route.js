import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个反馈信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            openid: true
          }
        }
      }
    })

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: '反馈不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feedback
    })
  } catch (error) {
    console.error('获取反馈信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新反馈信息
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
      status,
      reply
    } = body

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id }
    })

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, message: '反馈不存在' },
        { status: 404 }
      )
    }

    // 更新反馈信息
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: {
        status,
        reply,
        repliedAt: reply ? new Date() : null
      },
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '反馈信息更新成功',
      data: updatedFeedback
    })
  } catch (error) {
    console.error('更新反馈信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除反馈
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id }
    })

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, message: '反馈不存在' },
        { status: 404 }
      )
    }

    // 删除反馈
    await prisma.feedback.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '反馈删除成功'
    })
  } catch (error) {
    console.error('删除反馈失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  }
} 