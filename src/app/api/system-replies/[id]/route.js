import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个系统消息信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const systemReply = await prisma.systemReply.findUnique({
      where: { id }
    })

    if (!systemReply) {
      return NextResponse.json(
        { success: false, message: '系统消息不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: systemReply
    })
  } catch (error) {
    console.error('获取系统消息信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新系统消息信息
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
      title,
      type,
      content,
      status
    } = body

    // 检查系统消息是否存在
    const existingSystemReply = await prisma.systemReply.findUnique({
      where: { id }
    })

    if (!existingSystemReply) {
      return NextResponse.json(
        { success: false, message: '系统消息不存在' },
        { status: 404 }
      )
    }

    // 检查是否从未发布状态变为已发布状态
    const isFirstTimePublished = status === 'published' && existingSystemReply.status !== 'published'
    
    // 更新系统消息信息
    const updatedSystemReply = await prisma.systemReply.update({
      where: { id },
      data: {
        title,
        type,
        targetUsers: 'all', // 目前只针对所有微信账号
        content,
        status,
        publishedAt: status === 'published' && !existingSystemReply.publishedAt ? new Date() : existingSystemReply.publishedAt
      }
    })

    // 如果是第一次发布，则增加所有用户的未读消息数
    if (isFirstTimePublished) {
      console.log('📢 系统消息第一次发布，更新所有用户未读消息数')
      
      // 批量更新所有用户的未读消息数
      const updateResult = await prisma.wechatUserVerification.updateMany({
        data: {
          unreadMessages: {
            increment: 1
          }
        }
      })
      
      console.log(`✅ 已更新 ${updateResult.count} 个用户的未读消息数`)
      
      // 更新系统消息的总数统计
      await prisma.systemReply.update({
        where: { id: updatedSystemReply.id },
        data: {
          totalCount: updateResult.count
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '系统消息信息更新成功',
      data: updatedSystemReply
    })
  } catch (error) {
    console.error('更新系统消息信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除系统消息
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查系统消息是否存在
    const existingSystemReply = await prisma.systemReply.findUnique({
      where: { id }
    })

    if (!existingSystemReply) {
      return NextResponse.json(
        { success: false, message: '系统消息不存在' },
        { status: 404 }
      )
    }

    // 删除系统消息
    await prisma.systemReply.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '系统消息删除成功'
    })
  } catch (error) {
    console.error('删除系统消息失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  }
} 