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

    // 处理数据格式
    const processedMessages = systemMessages.map(message => ({
      id: message.id,
      title: message.title,
      content: message.content,
      type: message.type,
      status: message.status,
      readCount: message.readCount,
      totalCount: message.totalCount,
      publishedAt: message.publishedAt?.toISOString(),
      createdAt: message.createdAt?.toISOString(),
      updatedAt: message.updatedAt?.toISOString()
    }))

    return createSuccessResponse({
      messages: processedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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