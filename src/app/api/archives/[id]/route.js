import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个档案信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const archive = await prisma.archive.findUnique({
      where: { id }
    })

    if (!archive) {
      return NextResponse.json(
        { success: false, message: '档案不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: archive
    })
  } catch (error) {
    console.error('获取档案信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新档案信息
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
      archiveName,
      activity,
      photoCount,
      bodyPart
    } = body

    // 检查档案是否存在
    const existingArchive = await prisma.archive.findUnique({
      where: { id }
    })

    if (!existingArchive) {
      return NextResponse.json(
        { success: false, message: '档案不存在' },
        { status: 404 }
      )
    }

    // 构建更新数据对象，只更新提供的字段
    const updateData = {}
    if (archiveName !== undefined) updateData.archiveName = archiveName
    if (activity !== undefined) updateData.activity = activity
    if (photoCount !== undefined) updateData.photoCount = photoCount
    if (bodyPart !== undefined) updateData.bodyPart = bodyPart

    // 更新档案信息
    const updatedArchive = await prisma.archive.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: '档案信息更新成功',
      data: updatedArchive
    })
  } catch (error) {
    console.error('更新档案信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除档案
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查档案是否存在
    const existingArchive = await prisma.archive.findUnique({
      where: { id }
    })

    if (!existingArchive) {
      return NextResponse.json(
        { success: false, message: '档案不存在' },
        { status: 404 }
      )
    }

    // 删除档案
    await prisma.archive.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '档案删除成功'
    })
  } catch (error) {
    console.error('删除档案失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  }
} 