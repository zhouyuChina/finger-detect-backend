import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma/index.js'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

const prisma = new PrismaClient()

// 获取用户统计信息
async function getUserStats(request) {
  try {
    console.log('📊 Stats 接口被调用，用户ID:', request.user.id)
    
    const userId = request.user.id

    // 获取用户信息以获取关联的 userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        photos: true, 
        reports: true, 
        archives: true,
        userId: true // 获取关联的 userId
      }
    })

    if (!user) {
      console.log('❌ 用户不存在，用户ID:', userId)
      return createErrorResponse('用户不存在', 200)
    }

    // 并行查询各种统计数据
    const [
      photoRecords,
      reportRecords,
      profileRecords,
      totalDetections,
      unreadMessages
    ] = await Promise.all([
      // 拍照记录总数 (从用户表的 photos 字段)
      Promise.resolve(user.photos || 0),
      
      // 报告记录总数 (从用户表的 reports 字段)
      Promise.resolve(user.reports || 0),
      
      // 建档记录总数 (从用户表的 archives 字段)
      Promise.resolve(user.archives || 0),
      
      // 总检测次数 (从检测记录表，根据 userId 关联)
      prisma.detection.count({
        where: { 
          userId: user.userId || userId // 如果没有 userId 字段，使用用户 ID
        }
      }),
      
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
    await prisma.$disconnect()
  }
}

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getUserStats) 