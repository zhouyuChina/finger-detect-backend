import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取反馈列表
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
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const userId = searchParams.get('userId') || ''
    
    const skip = (page - 1) * pageSize
    
    // 构建查询条件
    const where = {}
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (userId) {
      where.userId = { contains: userId, mode: 'insensitive' }
    }
    
    // 查询反馈
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true
            }
          }
        }
      }),
      prisma.feedback.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        data: feedbacks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
    
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建反馈
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult
    
    const body = await request.json()
    const { userId, type, title, content, images } = body
    
    // 验证必填字段
    if (!userId || !type || !title || !content) {
      return NextResponse.json({
        success: false,
        message: '用户ID、类型、标题和内容是必填字段'
      }, { status: 400 })
    }
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }
    
    // 验证反馈类型
    const validTypes = ['bug', 'suggestion', 'complaint']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: '无效的反馈类型'
      }, { status: 400 })
    }
    
    // 创建反馈
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        title,
        content,
        images: images || []
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '反馈提交成功',
      data: feedback
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建反馈失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 