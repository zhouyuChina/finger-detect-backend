import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取未读系统消息数量
async function getUnreadSystemMessageCount(request) {
  let prisma = null
  try {
    console.log('📢 获取未读系统消息数量接口被调用')
    
    const userId = request.user?.id

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询用户的未读消息数量
    const userVerification = await prisma.wechatUserVerification.findUnique({
      where: {
        wechatUserId: userId
      },
      select: {
        unreadMessages: true
      }
    })

    const unreadCount = userVerification?.unreadMessages || 0

    console.log('✅ 获取未读系统消息数量成功:', unreadCount)

    return createSuccessResponse({
      unreadCount: unreadCount
    }, '获取未读系统消息数量成功')

  } catch (error) {
    console.error('❌ 获取未读系统消息数量错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取未读系统消息数量失败')
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
export const GET = miniprogramAuthMiddleware(getUnreadSystemMessageCount) 