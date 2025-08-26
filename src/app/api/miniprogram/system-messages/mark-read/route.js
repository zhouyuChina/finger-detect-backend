import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 标记系统消息为已读
async function markSystemMessageAsRead(request) {
  let prisma = null
  try {
    console.log('📢 标记系统消息为已读接口被调用')
    
    const userId = request.user?.id
    const body = await request.json()
    const { count = 1 } = body // 标记多少条消息为已读，默认1条

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询用户当前的未读消息数
    const userVerification = await prisma.wechatUserVerification.findUnique({
      where: {
        wechatUserId: userId
      },
      select: {
        unreadMessages: true
      }
    })

    if (!userVerification) {
      return createErrorResponse('用户验证信息不存在', 404)
    }

    const currentUnreadCount = userVerification.unreadMessages
    const decrementCount = Math.min(count, currentUnreadCount) // 不能减少超过当前未读数量

    if (decrementCount <= 0) {
      console.log('📢 没有未读消息需要标记')
      return createSuccessResponse({
        unreadCount: currentUnreadCount,
        marked: 0
      }, '没有未读消息需要标记')
    }

    // 减少用户的未读消息数
    const updatedVerification = await prisma.wechatUserVerification.update({
      where: {
        wechatUserId: userId
      },
      data: {
        unreadMessages: {
          decrement: decrementCount
        }
      },
      select: {
        unreadMessages: true
      }
    })

    console.log(`✅ 标记 ${decrementCount} 条消息为已读，剩余未读数: ${updatedVerification.unreadMessages}`)

    return createSuccessResponse({
      unreadCount: updatedVerification.unreadMessages,
      marked: decrementCount
    }, `成功标记 ${decrementCount} 条消息为已读`)

  } catch (error) {
    console.error('❌ 标记消息为已读错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('标记消息为已读失败')
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
export const POST = miniprogramAuthMiddleware(markSystemMessageAsRead)