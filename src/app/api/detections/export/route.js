import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'
import { createDetectionReportZip, createMultipleDetectionReportsZip } from '../../../../../src/lib/exportUtils.js'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const { detectionId } = body

    if (!detectionId) {
      return NextResponse.json(
        { success: false, message: '缺少检测记录ID参数' },
        { status: 400 }
      )
    }

    // 查询检测记录
    const detection = await prisma.detection.findUnique({
      where: { id: detectionId },
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
      updatedAt: detection.updatedAt
    }

    // 创建ZIP文件
    const zipResult = await createDetectionReportZip(formattedDetection)

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${zipResult.filename}"`)
    headers.set('Content-Length', zipResult.buffer.length.toString())

    return new NextResponse(zipResult.buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('导出检测报告失败:', error)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { success: false, message: `导出失败：${error.message}` },
      { status: 500 }
    )
  }
}
