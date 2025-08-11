import { NextResponse } from 'next/server'
import { prisma } from '../../../../../src/lib/db.js'
import { rateLimitMiddleware } from '../../../../../src/lib/middleware.js'
import { miniprogramAuthMiddleware } from '../../../../../src/lib/miniprogramAuth.js'

// 提交反馈
async function submitFeedback(request, context) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const user = request.user
    const body = await request.json()
    const { type, title, content, images } = body

    // 验证必填字段
    if (!type || !title || !content) {
      return NextResponse.json({
        success: false,
        message: '类型、标题和内容是必填字段'
      }, { status: 400 })
    }

    // 验证反馈类型
    const validTypes = ['bug', 'suggestion', 'complaint']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: '无效的反馈类型，支持的类型：bug（问题）、suggestion（建议）、complaint（投诉）'
      }, { status: 400 })
    }

    // 验证内容长度
    if (title.length > 100) {
      return NextResponse.json({
        success: false,
        message: '标题长度不能超过100个字符'
      }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({
        success: false,
        message: '内容长度不能超过1000个字符'
      }, { status: 400 })
    }

    // 验证图片数量
    if (images && images.length > 5) {
      return NextResponse.json({
        success: false,
        message: '最多只能上传5张图片'
      }, { status: 400 })
    }

    // 创建反馈
    const feedback = await prisma.feedback.create({
      data: {
        wechatUserId: user.id,
        type,
        title,
        content,
        images: images || [],
        status: 'pending'
      },
      include: {
        wechatUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    })

    console.log('✅ 用户反馈提交成功:', {
      userId: user.id,
      nickname: user.nickname,
      type,
      title
    })

    return NextResponse.json({
      success: true,
      message: '反馈提交成功，我们会尽快处理',
      data: {
        id: feedback.id,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ 提交反馈失败:', error.message)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { success: false, message: '提交失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// 查询反馈列表
async function getFeedbackList(request, context) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const user = request.user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {
      wechatUserId: user.id
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    // 查询反馈
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          images: true,
          status: true,
          reply: true,
          repliedAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.feedback.count({ where })
    ])

    // 格式化数据
    const formattedFeedbacks = feedbacks.map(feedback => ({
      id: feedback.id,
      type: feedback.type,
      typeText: getTypeText(feedback.type),
      title: feedback.title,
      content: feedback.content,
      images: feedback.images,
      status: feedback.status,
      statusText: getStatusText(feedback.status),
      reply: feedback.reply,
      repliedAt: feedback.repliedAt,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt
    }))

    return NextResponse.json({
      success: true,
      message: '获取反馈列表成功',
      data: {
        list: formattedFeedbacks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })

  } catch (error) {
    console.error('❌ 获取反馈列表失败:', error.message)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 获取类型文本
function getTypeText(type) {
  const typeMap = {
    'bug': '问题反馈',
    'suggestion': '功能建议',
    'complaint': '投诉建议'
  }
  return typeMap[type] || type
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

// 使用微信小程序认证中间件
export const POST = miniprogramAuthMiddleware(submitFeedback)
export const GET = miniprogramAuthMiddleware(getFeedbackList) 