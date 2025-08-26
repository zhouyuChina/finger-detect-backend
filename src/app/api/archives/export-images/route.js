import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'
import JSZip from 'jszip'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    console.log('🚀 导出图片API被调用')
    
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const { archiveName, userId } = body

    console.log('📤 请求参数:', { archiveName, userId })

    if (!archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少档案名称参数' },
        { status: 400 }
      )
    }

    console.log('🔍 开始查询数据库...')
    
    // 查询该档案下的所有图片
    const detections = await prisma.detection.findMany({
      where: {
        archiveName: archiveName,
        imageUrl: {
          not: null,
          not: ''
        }
      },
      select: {
        id: true,
        imageUrl: true,
        detectionTime: true,
        result: true,
        confidence: true,
        detectionType: true,
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
    
    console.log('✅ 数据库查询完成')

    console.log(`🔍 查询档案 "${archiveName}" 的检测记录:`)
    console.log(`- 查询到的记录数: ${detections.length}`)
    
    if (detections.length > 0) {
      console.log('📋 检测记录详情:')
      detections.forEach((detection, index) => {
        console.log(`${index + 1}. ID: ${detection.id}, 图片URL: ${detection.imageUrl}, 结果: ${detection.result}`)
      })
    }
    
    if (detections.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `档案"${archiveName}"下没有检测记录或图片数据`,
          details: '提示：需要通过小程序对该档案进行拍照检测后才会有图片数据可供导出'
        },
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

        // 构建实际文件路径，移除开头的斜杠
        const relativePath = detection.imageUrl.startsWith('/') ? detection.imageUrl.slice(1) : detection.imageUrl
        const filePath = join(process.cwd(), 'public', relativePath)
        
        console.log(`🔍 尝试读取文件: ${filePath}`)
        
        // 获取图片文件扩展名
        const urlParts = detection.imageUrl.split('.')
        const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg'
        
        // 构建文件名
        const detectionTime = detection.detectionTime 
          ? new Date(detection.detectionTime).toISOString().replace(/[:.]/g, '-').split('T')[0]
          : 'unknown-time'
        
        const result = detection.result || 'unknown'
        const confidence = detection.confidence ? Math.round(detection.confidence * 100) : 0
        
        // 检查文件是否存在
        if (!existsSync(filePath)) {
          console.warn(`❌ 文件不存在: ${filePath}`)
          // 尝试备用路径：直接在uploads目录查找文件名
          const fileName = detection.imageUrl.split('/').pop()
          const backupFilePath = join(process.cwd(), 'public', 'uploads', fileName)
          console.log(`🔄 尝试备用路径: ${backupFilePath}`)
          
          if (!existsSync(backupFilePath)) {
            console.warn(`❌ 备用路径也不存在: ${backupFilePath}`)
            return null
          }
          
          // 使用备用路径读取文件
          const imageBuffer = await readFile(backupFilePath)
          const finalFileName = `${String(index + 1).padStart(3, '0')}_${detectionTime}_${result}_${confidence}%.${extension}`
          zip.file(finalFileName, imageBuffer)
          console.log(`✅ 从备用路径成功读取文件: ${finalFileName}`)
          return finalFileName
        }
        
        const fileName = `${String(index + 1).padStart(3, '0')}_${detectionTime}_${result}_${confidence}%.${extension}`

        // 直接读取文件
        const imageBuffer = await readFile(filePath)
        zip.file(fileName, imageBuffer)

        console.log(`✅ 成功读取文件: ${fileName}`)
        return fileName
      } catch (error) {
        console.error(`❌ 读取图片失败: ${detection.imageUrl}`, error.message)
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
    
    // 对中文文件名进行编码
    const fileName = `${userNickname}_${archiveName}_${currentDate}.zip`
    const encodedFileName = encodeURIComponent(fileName)
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`)
    headers.set('Content-Length', zipBuffer.length.toString())

    return new NextResponse(zipBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('❌ 导出图片失败:', error)
    console.error('错误堆栈:', error.stack)
    console.error('错误名称:', error.name)
    console.error('错误消息:', error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        message: '导出失败，请重试',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
