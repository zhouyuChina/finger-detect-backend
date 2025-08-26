import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取单个系统消息详情
async function getSystemMessageDetail(request, context) {
  let prisma = null
  try {
    console.log('📢 获取系统消息详情接口被调用')
    
    // 从 URL 中提取消息ID
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const messageId = pathSegments[pathSegments.length - 1]
    
    if (!messageId) {
      return createErrorResponse('缺少消息ID', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询系统消息详情
    const systemMessage = await prisma.systemReply.findFirst({
      where: { 
        id: messageId,
        status: 'published',
        isActive: true
      },
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
    })

    if (!systemMessage) {
      return createErrorResponse('系统消息不存在或未发布', 404)
    }

    // 增加阅读次数
    await prisma.systemReply.update({
      where: { id: messageId },
      data: {
        readCount: {
          increment: 1
        }
      }
    })

    // 减少用户的未读消息数（如果有的话）
    const userId = request.user?.id
    if (userId) {
      try {
        const userVerification = await prisma.wechatUserVerification.findUnique({
          where: { wechatUserId: userId },
          select: { unreadMessages: true }
        })
        
        if (userVerification && userVerification.unreadMessages > 0) {
          await prisma.wechatUserVerification.update({
            where: { wechatUserId: userId },
            data: {
              unreadMessages: {
                decrement: 1
              }
            }
          })
          console.log('📢 用户未读消息数已减少1')
        }
      } catch (error) {
        console.log('⚠️ 更新未读消息数失败:', error.message)
        // 不影响主要流程，继续执行
      }
    }

    console.log('✅ 获取系统消息详情成功:', systemMessage.title)

    // 处理数据格式
    const processedMessage = {
      id: systemMessage.id,
      title: systemMessage.title,
      content: systemMessage.content,
      type: systemMessage.type,
      status: systemMessage.status,
      readCount: systemMessage.readCount + 1, // 包含本次阅读
      totalCount: systemMessage.totalCount,
      publishedAt: systemMessage.publishedAt?.toISOString(),
      createdAt: systemMessage.createdAt?.toISOString(),
      updatedAt: systemMessage.updatedAt?.toISOString()
    }

    return createSuccessResponse(processedMessage, '获取系统消息详情成功')

  } catch (error) {
    console.error('❌ 获取系统消息详情错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取系统消息详情失败')
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
export const GET = miniprogramAuthMiddleware(getSystemMessageDetail) 