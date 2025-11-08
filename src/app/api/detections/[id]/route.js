import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取单个检测报告详情
export async function GET(request, { params }) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少检测记录ID' },
        { status: 400 }
      )
    }

    // 查询检测记录详情
    const detection = await prisma.detection.findUnique({
      where: { id },
      include: {
        subUser: {
          include: {
            wechatUser: true
          }
        }
      }
    })

    if (!detection) {
      return NextResponse.json(
        { success: false, message: '检测记录不存在' },
        { status: 404 }
      )
    }

    // 转换数据格式
    const formattedDetection = {
      id: detection.id,
      openid: detection.subUser?.wechatUser?.openid || '未知',
      userName: detection.subUser?.realName || detection.subUser?.wechatUser?.nickname || '未知',
      archiveName: detection.archiveName,
      archiveId: detection.archiveId || '未知',
      imageUrl: detection.imageUrl,
      result: detection.result,
      confidence: detection.confidence,
      status: detection.status,
      detectionTime: detection.detectionTime,
      createdAt: detection.createdAt,
      updatedAt: detection.updatedAt,
      remark: detection.remark,
      detectionType: detection.detectionType,
      errorMsg: detection.errorMsg
    }

    return NextResponse.json({
      success: true,
      data: formattedDetection
    })
  } catch (error) {
    console.error('获取检测记录详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 删除检测记录
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

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少检测记录ID' },
        { status: 400 }
      )
    }

    prisma = new PrismaClient()

    // 检查检测记录是否存在，并获取相关信息
    const existingDetection = await prisma.detection.findUnique({
      where: { id },
      include: {
        subUser: {
          select: {
            id: true,
            username: true,
            realName: true,
            photos: true,
            reports: true
          }
        }
      }
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

    // 更新子用户的拍照数和报告数统计
    const currentPhotos = existingDetection.subUser.photos
    const currentReports = existingDetection.subUser.reports
    await prisma.subUser.update({
      where: { id: existingDetection.subUserId },
      data: {
        photos: Math.max(0, currentPhotos - 1),
        reports: Math.max(0, currentReports - 1)
      }
    })

    // 更新档案的拍照数量
    await prisma.archive.updateMany({
      where: {
        archiveName: existingDetection.archiveName,
        subUserId: existingDetection.subUserId
      },
      data: {
        photoCount: {
          decrement: 1
        }
      }
    })

    console.log(`✅ 已删除检测记录: ${existingDetection.id}`)
    console.log(`   - 所属用户: ${existingDetection.subUser.username || existingDetection.subUser.realName}`)
    console.log(`   - 所属档案: ${existingDetection.archiveName}`)

    return NextResponse.json({
      success: true,
      message: '检测记录删除成功',
      data: {
        deletedDetection: existingDetection.id,
        archiveName: existingDetection.archiveName
      }
    })
  } catch (error) {
    console.error('删除检测记录失败:', error)
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