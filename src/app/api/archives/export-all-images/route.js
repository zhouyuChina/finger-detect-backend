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
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 查询所有检测记录，按用户分组
    console.log('开始查询检测记录...')
    
    const detections = await prisma.detection.findMany({
      where: {
        imageUrl: {
          not: null,
          not: ""
        }
      },
      select: {
        id: true,
        imageUrl: true,
        detectionTime: true,
        result: true,
        confidence: true,
        archiveName: true,
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

    console.log(`查询到 ${detections.length} 条检测记录`)

    if (detections.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '数据库中没有任何检测记录或图片数据，请先进行检测后再尝试导出',
          details: '提示：需要通过小程序进行拍照检测后才会有图片数据可供导出'
        },
        { status: 404 }
      )
    }

    // 按用户分组
    const userGroups = {}
    detections.forEach(detection => {
      const userId = detection.subUser?.username || 'unknown'
      const userNickname = detection.subUser?.realName || '未知用户'
      
      if (!userGroups[userId]) {
        userGroups[userId] = {
          userNickname,
          detections: []
        }
      }
      userGroups[userId].detections.push(detection)
    })

    // 创建zip文件
    const zip = new JSZip()
    const currentDate = new Date().toISOString().split('T')[0]

    // 为每个用户创建文件夹并下载图片
    const downloadPromises = Object.entries(userGroups).map(async ([userId, userData]) => {
      const userFolder = zip.folder(`${userData.userNickname}_${userId}`)
      
      // 下载该用户的所有图片
      console.log(`开始下载用户 ${userId} 的图片，共 ${userData.detections.length} 张`)
      
      const userImagePromises = userData.detections.map(async (detection, index) => {
        try {
          if (!detection.imageUrl) {
            console.warn(`检测记录 ${detection.id} 没有图片URL`)
            return null
          }

          // 构建实际文件路径，移除开头的斜杠
          const relativePath = detection.imageUrl.startsWith('/') ? detection.imageUrl.slice(1) : detection.imageUrl
          const filePath = join(process.cwd(), 'public', relativePath)
          
          console.log(`🔍 尝试读取文件: ${filePath}`)
          
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
            userFolder.file(fileName, imageBuffer)
            console.log(`✅ 从备用路径成功读取文件: ${fileName}`)
            return fileName
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
          const archiveName = detection.archiveName || 'unknown-archive'
          
          const fileName = `${String(index + 1).padStart(3, '0')}_${archiveName}_${detectionTime}_${result}_${confidence}%.${extension}`

          // 直接读取文件
          const imageBuffer = await readFile(filePath)
          userFolder.file(fileName, imageBuffer)
          console.log(`✅ 成功读取文件: ${fileName}`)

          return fileName
        } catch (error) {
          console.error(`❌ 读取图片失败: ${detection.imageUrl}`, error.message)
          return null
        }
      })

      const userImages = await Promise.all(userImagePromises)
      const successfulImages = userImages.filter(file => file !== null)
      
      return {
        userId,
        userNickname: userData.userNickname,
        imageCount: successfulImages.length
      }
    })

    // 等待所有用户图片下载完成
    const userResults = await Promise.all(downloadPromises)
    const successfulUsers = userResults.filter(result => result.imageCount > 0)

    console.log(`用户结果:`, userResults)
    console.log(`成功用户数:`, successfulUsers.length)

    // 添加导出信息文件
    const exportInfo = {
      exportTime: new Date().toISOString(),
      totalUsers: Object.keys(userGroups).length,
      successfulUsers: successfulUsers.length,
      totalImages: detections.length,
      successfulImages: successfulUsers.reduce((sum, user) => sum + user.imageCount, 0)
    }
    
    zip.file('export_info.txt', Buffer.from(JSON.stringify(exportInfo, null, 2)))
    
    if (successfulUsers.length === 0) {
      // 即使没有成功下载的图片，也返回包含信息的zip文件
      console.log('没有成功下载的图片，但创建了信息文件')
    }

    // 生成zip文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="全部图片_按用户分类_${currentDate}.zip"`)
    headers.set('Content-Length', zipBuffer.length.toString())

    return new NextResponse(zipBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('导出所有图片失败:', error)
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
