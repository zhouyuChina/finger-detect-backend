import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取检测记录列表
export async function GET(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const userId = searchParams.get('userId') || ''
    const userNickname = searchParams.get('userNickname') || ''
    const archiveName = searchParams.get('archiveName') || ''
    const bodyPart = searchParams.get('bodyPart') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {}
    
    if (userId) {
      where.userId = { contains: userId, mode: 'insensitive' }
    }
    
    if (userNickname) {
      where.userNickname = { contains: userNickname, mode: 'insensitive' }
    }
    
    if (archiveName) {
      where.archiveName = { contains: archiveName, mode: 'insensitive' }
    }
    
    if (bodyPart) {
      where.bodyPart = bodyPart
    }

    // 查询数据
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.detection.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: detections,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取检测记录列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建检测记录
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const {
      userId,
      userNickname,
      archiveName,
      bodyPart = 'finger',
      imageUrl,
      result,
      confidence,
      status = 'pending'
    } = body

    // 验证必填字段
    if (!userId || !userNickname || !archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 创建检测记录
    const detection = await prisma.detection.create({
      data: {
        userId,
        userNickname,
        archiveName,
        bodyPart,
        imageUrl: imageUrl || '',
        result: result || '',
        confidence: confidence || 0,
        status
      }
    })

    return NextResponse.json({
      success: true,
      message: '检测记录创建成功',
      data: detection
    })
  } catch (error) {
    console.error('创建检测记录失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 