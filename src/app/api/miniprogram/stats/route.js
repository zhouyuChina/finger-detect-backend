import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取用户统计信息
async function getUserStats(request) {
  let prisma = null
  try {
    console.log('📊 Stats 接口被调用，用户ID:', request.user.id)
    
    const userId = request.user.id

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取微信用户信息
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        openid: true
      }
    })

    if (!wechatUser) {
      console.log('❌ 微信用户不存在，用户ID:', userId)
      return createErrorResponse('用户不存在', 200)
    }

    // 获取当前子用户ID（用于业务数据统计）
    const currentSubUserId = request.user.currentSubUser?.id || null

    // 并行查询各种统计数据
    const [
      photoRecords,
      reportRecords,
      profileRecords,
      totalDetections,
      unreadMessages
    ] = await Promise.all([
      // 拍照记录总数 (从子用户表的 photos 字段，如果没有子用户则返回0)
      currentSubUserId ? 
        prisma.subUser.findUnique({
          where: { id: currentSubUserId },
          select: { photos: true }
        }).then(user => user?.photos || 0) :
        Promise.resolve(0),
      
      // 报告记录总数 (从子用户表的 reports 字段)
      currentSubUserId ? 
        prisma.subUser.findUnique({
          where: { id: currentSubUserId },
          select: { reports: true }
        }).then(user => user?.reports || 0) :
        Promise.resolve(0),
      
      // 建档记录总数 (从子用户表的 archives 字段)
      currentSubUserId ? 
        prisma.subUser.findUnique({
          where: { id: currentSubUserId },
          select: { archives: true }
        }).then(user => user?.archives || 0) :
        Promise.resolve(0),
      
      // 总检测次数 (从检测记录表，根据子用户ID关联)
      currentSubUserId ? 
        prisma.detection.count({
          where: { 
            subUserId: currentSubUserId
          }
        }) :
        Promise.resolve(0),
      
      // 未读消息数量 (从系统回复表，这里暂时返回 0，需要根据实际业务逻辑调整)
      Promise.resolve(0) // 暂时返回 0，因为当前没有用户消息读取状态表
    ])

    console.log('✅ 统计数据查询成功')

    // 构建响应数据，支持多种字段名称
    const statsData = {
      totalRecords: photoRecords,
      photoRecords: photoRecords,
      totalReports: reportRecords,
      reportRecords: reportRecords,
      familyMembers: profileRecords,
      profileRecords: profileRecords,
      totalDetections: totalDetections,
      detectionCount: totalDetections,
      unreadMessages: unreadMessages,
      unreadCount: unreadMessages
    }

    return createSuccessResponse(statsData, '获取用户统计信息成功')

  } catch (error) {
    console.error('❌ 获取用户统计信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取用户统计信息失败')
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
export const GET = miniprogramAuthMiddleware(getUserStats) 