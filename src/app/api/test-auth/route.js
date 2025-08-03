import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware } from '../../../../src/lib/miniprogramAuth.js'

async function testAuth(request) {
  try {
    console.log('🔐 测试认证中间件')
    console.log('👤 用户信息:', request.user)
    
    return NextResponse.json({
      success: true,
      message: '认证测试成功',
      data: {
        user: request.user,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ 认证测试失败:', error.message)
    return NextResponse.json({
      success: false,
      message: '认证测试失败: ' + error.message,
      code: 500
    }, { status: 500 })
  }
}

export const GET = miniprogramAuthMiddleware(testAuth)
export const POST = miniprogramAuthMiddleware(testAuth) 