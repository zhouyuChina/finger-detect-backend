import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    console.log('🚀 开始导出测试')
    
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 查询检测记录
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
        subUser: {
          select: {
            username: true,
            realName: true
          }
        }
      },
      take: 5 // 只取前5条记录测试
    })

    console.log(`📊 查询到 ${detections.length} 条检测记录`)

    if (detections.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有找到检测记录',
        debug: '数据库中detection表为空或没有imageUrl'
      })
    }

    // 检查文件系统
    const { join } = await import('node:path')
    const { existsSync } = await import('node:fs')
    
    const fileCheckResults = detections.map(detection => {
      const relativePath = detection.imageUrl.startsWith('/') ? detection.imageUrl.slice(1) : detection.imageUrl
      const filePath = join(process.cwd(), 'public', relativePath)
      const backupFilePath = join(process.cwd(), 'public', 'uploads', detection.imageUrl.split('/').pop())
      
      return {
        id: detection.id,
        imageUrl: detection.imageUrl,
        filePath,
        fileExists: existsSync(filePath),
        backupFilePath,
        backupExists: existsSync(backupFilePath),
        cwd: process.cwd()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        detectionCount: detections.length,
        detections: detections,
        fileChecks: fileCheckResults,
        serverInfo: {
          cwd: process.cwd(),
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    })

  } catch (error) {
    console.error('❌ 测试失败:', error)
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}