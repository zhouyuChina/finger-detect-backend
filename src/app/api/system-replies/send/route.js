import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 发送系统消息到指定微信账号
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
      systemReplyId, // 系统消息ID
      targetOpenIds = [], // 目标微信账号的 openId 数组，为空则发送给所有用户
      sendImmediately = false // 是否立即发送
    } = body

    // 验证必填字段
    if (!systemReplyId) {
      return NextResponse.json(
        { success: false, message: '系统消息ID是必填字段' },
        { status: 400 }
      )
    }

    // 检查系统消息是否存在
    const systemReply = await prisma.systemReply.findUnique({
      where: { id: systemReplyId }
    })

    if (!systemReply) {
      return NextResponse.json(
        { success: false, message: '系统消息不存在' },
        { status: 404 }
      )
    }

    // 检查系统消息状态
    if (systemReply.status !== 'published') {
      return NextResponse.json(
        { success: false, message: '只能发送已发布的系统消息' },
        { status: 400 }
      )
    }

    // TODO: 实现微信消息发送逻辑
    // 这里预留接口，未来实现具体的微信消息发送功能
    
    let targetUsers = []
    
    if (targetOpenIds.length > 0) {
      // 发送给指定用户
      // TODO: 根据 openId 数组查询用户信息
      // targetUsers = await prisma.wechatUser.findMany({
      //   where: { openId: { in: targetOpenIds } }
      // })
      console.log('发送给指定用户:', targetOpenIds)
    } else {
      // 发送给所有用户
      // TODO: 查询所有用户
      // targetUsers = await prisma.wechatUser.findMany({
      //   where: { isActive: true }
      // })
      console.log('发送给所有用户')
    }

    // TODO: 调用微信 API 发送消息
    // 示例代码：
    // for (const user of targetUsers) {
    //   await sendWechatMessage({
    //     openId: user.openId,
    //     title: systemReply.title,
    //     content: systemReply.content,
    //     type: systemReply.type
    //   })
    // }

    // 更新发送记录
    const sendRecord = await prisma.systemReplySendRecord.create({
      data: {
        systemReplyId,
        targetOpenIds: targetOpenIds.length > 0 ? targetOpenIds : null, // null 表示发送给所有用户
        sendImmediately,
        status: 'pending', // pending, sent, failed
        scheduledAt: sendImmediately ? new Date() : null,
        sentAt: null,
        errorMessage: null
      }
    })

    return NextResponse.json({
      success: true,
      message: '系统消息发送任务已创建',
      data: {
        sendRecordId: sendRecord.id,
        targetCount: targetOpenIds.length > 0 ? targetOpenIds.length : 'all',
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('发送系统消息失败:', error)
    return NextResponse.json(
      { success: false, message: '发送失败' },
      { status: 500 }
    )
  }
}

// 获取发送记录
export async function GET(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { searchParams } = new URL(request.url)
    const systemReplyId = searchParams.get('systemReplyId')
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {}
    
    if (systemReplyId) {
      where.systemReplyId = systemReplyId
    }

    // 查询发送记录
    const [sendRecords, total] = await Promise.all([
      prisma.systemReplySendRecord.findMany({
        where,
        include: {
          systemReply: {
            select: {
              title: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.systemReplySendRecord.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: sendRecords,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取发送记录失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}
