import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取档案列表
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
    const activity = searchParams.get('activity') || ''
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
    
    if (activity) {
      where.activity = activity
    }
    
    if (bodyPart) {
      where.bodyPart = bodyPart
    }

    // 查询数据
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.archive.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: archives,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取档案列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建档案记录
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
      activity = 'medium',
      photoCount = 0,
      bodyPart = 'finger'
    } = body

    // 验证必填字段
    if (!userId || !userNickname || !archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 创建档案记录
    const archive = await prisma.archive.create({
      data: {
        userId,
        userNickname,
        archiveName,
        activity,
        photoCount,
        bodyPart
      }
    })

    return NextResponse.json({
      success: true,
      message: '档案创建成功',
      data: archive
    })
  } catch (error) {
    console.error('创建档案失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 