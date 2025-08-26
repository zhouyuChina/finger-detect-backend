import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取系统消息列表
async function getSystemMessages(request) {
  let prisma = null
  try {
    console.log('📢 获取系统消息接口被调用')
    
    const userId = request.user?.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || 'published'

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    const skip = (page - 1) * limit

    // 构建查询条件
    const where = {
      status: status, // 默认只获取已发布的消息
      isActive: true
    }
    
    // 如果指定了类型，添加类型过滤
    if (type) {
      where.type = type
    }

    // 获取用户的未读消息数量
    const userVerification = await prisma.wechatUserVerification.findUnique({
      where: {
        wechatUserId: userId
      },
      select: {
        unreadMessages: true
      }
    })

    const unreadCount = userVerification?.unreadMessages || 0

    // 查询系统消息
    const [systemMessages, total] = await Promise.all([
      prisma.systemReply.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          status: true,
          readCount: true,
          totalCount: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.systemReply.count({ where })
    ])

    console.log('✅ 获取系统消息成功，数量:', systemMessages.length)
    console.log('📊 用户未读消息数:', unreadCount)

    // 为了确定哪些消息是未读的，我们需要获取所有消息的发布时间进行排序
    // 最新的 unreadCount 条消息标记为未读
    let allMessageIds = []
    if (unreadCount > 0) {
      // 获取所有已发布消息的ID，按发布时间倒序
      const allMessages = await prisma.systemReply.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        select: { id: true },
        take: unreadCount // 只需要前N条（N=未读数量）
      })
      allMessageIds = allMessages.map(msg => msg.id)
    }

    // 处理数据格式，添加 isRead 字段
    const processedMessages = systemMessages.map((message, index) => ({
      id: message.id,
      title: message.title,
      content: message.content,
      type: message.type,
      status: message.status,
      readCount: message.readCount,
      totalCount: message.totalCount,
      publishedAt: message.publishedAt?.toISOString(),
      createdAt: message.createdAt?.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      isRead: !allMessageIds.includes(message.id) // 如果不在未读消息ID列表中，则为已读
    }))

    console.log('📊 处理后的消息状态统计:')
    const readCount = processedMessages.filter(msg => msg.isRead).length
    const currentUnreadCount = processedMessages.filter(msg => !msg.isRead).length
    console.log(`   - 当前页已读消息: ${readCount}`)
    console.log(`   - 当前页未读消息: ${currentUnreadCount}`)

    return createSuccessResponse({
      messages: processedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount: unreadCount // 额外返回总未读数
    }, '获取系统消息成功')

  } catch (error) {
    console.error('❌ 获取系统消息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取系统消息失败')
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getSystemMessages) 