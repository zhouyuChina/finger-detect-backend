import { NextResponse } from 'next/server'
import { rateLimitMiddleware } from '../../../../../../src/lib/middleware.js'
import { miniprogramAuthMiddleware } from '../../../../../../src/lib/miniprogramAuth.js'

// 获取反馈详情
async function getFeedbackDetail(request, context) {
  let prisma = null
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const user = request.user
    const { id } = context.params

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../../src/generated/prisma/index.js')
    prisma = new PrismaClient()

    console.log('🔍 查询反馈详情:', { id, userId: user.id })

    // 查询反馈详情
    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        wechatUserId: user.id
      },
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
    })

    if (!feedback) {
      return NextResponse.json({
        success: false,
        message: '反馈不存在或无权限访问'
      }, { status: 404 })
    }

    // 格式化数据
    const formattedFeedback = {
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
    }

    return NextResponse.json({
      success: true,
      message: '获取反馈详情成功',
      data: formattedFeedback
    })

  } catch (error) {
    console.error('❌ 获取反馈详情失败:', error.message)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
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
export const GET = miniprogramAuthMiddleware(getFeedbackDetail) 