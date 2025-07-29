import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取系统消息列表
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
    const title = searchParams.get('title') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const targetUsers = searchParams.get('targetUsers') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {}
    
    if (title) {
      where.title = { contains: title, mode: 'insensitive' }
    }
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (targetUsers) {
      where.targetUsers = targetUsers
    }

    // 查询数据
    const [systemReplies, total] = await Promise.all([
      prisma.systemReply.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.systemReply.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: systemReplies,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取系统消息列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建系统消息
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
      title,
      type,
      targetUsers = 'all',
      content,
      status = 'draft'
    } = body

    // 验证必填字段
    if (!title || !type || !content) {
      return NextResponse.json(
        { success: false, message: '标题、类型和内容是必填字段' },
        { status: 400 }
      )
    }

    // 验证类型
    const validTypes = ['system_notice', 'activity_announcement', 'feature_update', 'maintenance_notice', 'security_alert']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的消息类型' },
        { status: 400 }
      )
    }

    // 验证状态
    const validStatuses = ['draft', 'published', 'expired', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: '无效的状态' },
        { status: 400 }
      )
    }

    // 创建系统消息
    const systemReply = await prisma.systemReply.create({
      data: {
        title,
        type,
        targetUsers,
        content,
        status,
        publishedAt: status === 'published' ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      message: '系统消息创建成功',
      data: systemReply
    }, { status: 201 })
  } catch (error) {
    console.error('创建系统消息失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 