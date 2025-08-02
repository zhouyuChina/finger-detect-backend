import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 调试接口被调用')
    
    // 测试 Prisma 客户端
    let prismaStatus = 'unknown'
    try {
      const { PrismaClient } = await import('../../../generated/prisma/index.js')
      const prisma = new PrismaClient()
      await prisma.user.count()
      await prisma.$disconnect()
      prismaStatus = 'success'
    } catch (error) {
      prismaStatus = `error: ${error.message}`
    }
    
    // 测试环境变量
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      WECHAT_APP_ID: process.env.WECHAT_APP_ID ? '已配置' : '未配置',
      WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ? '已配置' : '未配置',
      DATABASE_URL: process.env.DATABASE_URL ? '已配置' : '未配置'
    }
    
    return NextResponse.json({
      success: true,
      message: '调试信息',
      data: {
        prismaStatus,
        envInfo,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ 调试接口错误:', error)
    return NextResponse.json({
      success: false,
      message: error.message,
      error: error.stack
    }, { status: 500 })
  }
} 