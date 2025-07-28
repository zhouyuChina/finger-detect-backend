import { NextResponse } from 'next/server'
import { testConnection } from '../../../lib/db.js'
import { getRedisClient } from '../../../lib/redis.js'

export async function GET() {
  try {
    // 检查数据库连接
    const dbStatus = await testConnection()
    
    // 检查Redis连接
    const redisClient = await getRedisClient()
    const redisStatus = redisClient ? { success: true, message: 'Redis连接正常' } : { success: false, message: 'Redis连接失败' }
    
    // 检查系统状态
    const systemStatus = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbStatus,
      redis: redisStatus,
      environment: process.env.NODE_ENV
    }
    
    return NextResponse.json({
      success: true,
      message: '系统健康检查完成',
      data: systemStatus
    })
  } catch (error) {
    console.error('健康检查失败:', error)
    return NextResponse.json({
      success: false,
      message: '系统健康检查失败',
      error: error.message
    }, { status: 500 })
  }
} 