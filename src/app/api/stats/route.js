import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'
import { getCache, setCache } from '../../../lib/redis.js'

// 获取统计数据
export async function GET(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult?.error) return NextResponse.json(authResult, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today' // today, week, month, year
    
    // 尝试从缓存获取数据
    const cacheKey = `stats:${period}`
    const cachedData = await getCache(cacheKey)
    if (cachedData) {
      return wrapResponse(cachedData, '获取统计数据成功')
    }
    
    // 计算时间范围
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }
    
    // 并行查询统计数据
    const [
      totalUsers,
      newUsers,
      totalDetections,
      newDetections,
      successDetections,
      totalFeedbacks,
      newFeedbacks,
      pendingFeedbacks
    ] = await Promise.all([
      // 总用户数
      prisma.user.count({ where: { isActive: true } }),
      
      // 新增用户数
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: { gte: startDate }
        }
      }),
      
      // 总检测数
      prisma.detection.count(),
      
      // 新增检测数
      prisma.detection.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // 成功检测数
      prisma.detection.count({
        where: {
          status: 'completed',
          createdAt: { gte: startDate }
        }
      }),
      
      // 总反馈数
      prisma.feedback.count(),
      
      // 新增反馈数
      prisma.feedback.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // 待处理反馈数
      prisma.feedback.count({
        where: {
          status: 'pending'
        }
      })
    ])
    
    // 计算成功率
    const successRate = newDetections > 0 ? (successDetections / newDetections * 100).toFixed(1) : 0
    
    // 获取每日数据趋势
    const dailyStats = await getDailyStats(startDate, now)
    
    const stats = {
      overview: {
        totalUsers,
        newUsers,
        totalDetections,
        newDetections,
        successRate: `${successRate}%`,
        totalFeedbacks,
        newFeedbacks,
        pendingFeedbacks
      },
      trends: dailyStats,
      period,
      lastUpdated: new Date().toISOString()
    }
    
    // 缓存数据5分钟
    await setCache(cacheKey, stats, 300)
    
    return wrapResponse(stats, '获取统计数据成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 获取每日统计数据
async function getDailyStats(startDate, endDate) {
  const days = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayStart = new Date(current)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(current)
    dayEnd.setHours(23, 59, 59, 999)
    
    const [users, detections, feedbacks] = await Promise.all([
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      }),
      prisma.detection.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      }),
      prisma.feedback.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      })
    ])
    
    days.push({
      date: current.toISOString().split('T')[0],
      users,
      detections,
      feedbacks
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return days
} 