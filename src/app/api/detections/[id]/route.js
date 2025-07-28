import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个检测记录信息
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    const detection = await prisma.detection.findUnique({
      where: { id }
    })

    if (!detection) {
      return NextResponse.json(
        { success: false, message: '检测记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: detection
    })
  } catch (error) {
    console.error('获取检测记录信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 更新检测记录信息
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
      userId,
      userNickname,
      archiveName,
      bodyPart,
      imageUrl,
      result,
      confidence,
      status
    } = body

    // 检查检测记录是否存在
    const existingDetection = await prisma.detection.findUnique({
      where: { id }
    })

    if (!existingDetection) {
      return NextResponse.json(
        { success: false, message: '检测记录不存在' },
        { status: 404 }
      )
    }

    // 更新检测记录信息
    const updatedDetection = await prisma.detection.update({
      where: { id },
      data: {
        userId,
        userNickname,
        archiveName,
        bodyPart,
        imageUrl,
        result,
        confidence,
        status
      }
    })

    return NextResponse.json({
      success: true,
      message: '检测记录信息更新成功',
      data: updatedDetection
    })
  } catch (error) {
    console.error('更新检测记录信息失败:', error)
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除检测记录
export async function DELETE(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    // 检查检测记录是否存在
    const existingDetection = await prisma.detection.findUnique({
      where: { id }
    })

    if (!existingDetection) {
      return NextResponse.json(
        { success: false, message: '检测记录不存在' },
        { status: 404 }
      )
    }

    // 删除检测记录
    await prisma.detection.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '检测记录删除成功'
    })
  } catch (error) {
    console.error('删除检测记录失败:', error)
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    )
  }
} 