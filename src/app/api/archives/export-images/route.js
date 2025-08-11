import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'
import JSZip from 'jszip'
import fetch from 'node-fetch'

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
    const { archiveName, userId } = body

    if (!archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少档案名称参数' },
        { status: 400 }
      )
    }

    // 查询该档案下的所有图片
    const detections = await prisma.detection.findMany({
      where: {
        archiveName: archiveName
      },
      select: {
        id: true,
        imageUrl: true,
        detectionTime: true,
        result: true,
        confidence: true,
        subUser: {
          select: {
            username: true,
            realName: true
          }
        }
      },
      orderBy: {
        detectionTime: 'asc'
      }
    })

    if (detections.length === 0) {
      return NextResponse.json(
        { success: false, message: '该档案下没有图片' },
        { status: 404 }
      )
    }

    // 创建zip文件
    const zip = new JSZip()
    const userNickname = detections[0]?.subUser?.realName || userId || 'unknown'
    const currentDate = new Date().toISOString().split('T')[0]

    // 下载并添加图片到zip
    const downloadPromises = detections.map(async (detection, index) => {
      try {
        if (!detection.imageUrl) {
          console.warn(`检测记录 ${detection.id} 没有图片URL`)
          return null
        }

        // 获取图片文件扩展名
        const urlParts = detection.imageUrl.split('.')
        const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg'
        
        // 构建文件名
        const detectionTime = detection.detectionTime 
          ? new Date(detection.detectionTime).toISOString().replace(/[:.]/g, '-').split('T')[0]
          : 'unknown-time'
        
        const result = detection.result || 'unknown'
        const confidence = detection.confidence ? Math.round(detection.confidence * 100) : 0
        
        const fileName = `${String(index + 1).padStart(3, '0')}_${detectionTime}_${result}_${confidence}%.${extension}`

        // 下载图片
        const response = await fetch(detection.imageUrl)
        if (!response.ok) {
          console.warn(`无法下载图片: ${detection.imageUrl}`)
          return null
        }

        const imageBuffer = await response.buffer()
        zip.file(fileName, imageBuffer)

        return fileName
      } catch (error) {
        console.error(`下载图片失败: ${detection.imageUrl}`, error)
        return null
      }
    })

    // 等待所有图片下载完成
    const downloadedFiles = await Promise.all(downloadPromises)
    const successfulDownloads = downloadedFiles.filter(file => file !== null)

    if (successfulDownloads.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有可下载的图片' },
        { status: 500 }
      )
    }

    // 生成zip文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${userNickname}_${archiveName}_${currentDate}.zip"`)
    headers.set('Content-Length', zipBuffer.length.toString())

    return new NextResponse(zipBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('导出图片失败:', error)
    return NextResponse.json(
      { success: false, message: '导出失败，请重试' },
      { status: 500 }
    )
  }
}
