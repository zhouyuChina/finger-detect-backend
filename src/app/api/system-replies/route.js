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
      content,
      status = 'unpublished'
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
    const validStatuses = ['unpublished', 'published']
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
        targetUsers: 'all', // 目前只针对所有微信账号
        content,
        status,
        publishedAt: status === 'published' ? new Date() : null
      }
    })

    // 如果消息状态为已发布，则增加所有用户的未读消息数
    if (status === 'published') {
      console.log('📢 系统消息已发布，更新所有用户未读消息数')
      
      // 批量更新所有用户的未读消息数
      const updateResult = await prisma.wechatUserVerification.updateMany({
        data: {
          unreadMessages: {
            increment: 1
          }
        }
      })
      
      console.log(`✅ 已更新 ${updateResult.count} 个用户的未读消息数`)
      
      // 更新系统消息的总数统计
      await prisma.systemReply.update({
        where: { id: systemReply.id },
        data: {
          totalCount: updateResult.count
        }
      })
    }

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