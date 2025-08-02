import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🔍 测试接口被调用')
    
    // 测试数据库连接
    const userCount = await prisma.user.count()
    console.log('✅ 数据库连接正常，用户数量:', userCount)
    
    // 测试环境变量
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      WECHAT_APP_ID: process.env.WECHAT_APP_ID ? '已配置' : '未配置',
      WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ? '已配置' : '未配置',
      DATABASE_URL: process.env.DATABASE_URL ? '已配置' : '未配置'
    }
    console.log('🔧 环境变量:', envInfo)
    
    return NextResponse.json({
      success: true,
      message: '测试接口正常',
      data: {
        userCount,
        envInfo,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ 测试接口错误:', error)
    return NextResponse.json({
      success: false,
      message: error.message,
      error: error.stack
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 