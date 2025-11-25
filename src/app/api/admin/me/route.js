import { NextResponse } from 'next/server'
import { adminAuthMiddleware } from '@/lib/middleware.js'

// 获取当前登录管理员信息
export async function GET(request) {
  try {
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 返回管理员信息(authResult 就是管理员信息)
    return NextResponse.json({
      success: true,
      data: authResult
    })
  } catch (error) {
    console.error('获取管理员信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败', error: error.message },
      { status: 500 }
    )
  }
}
