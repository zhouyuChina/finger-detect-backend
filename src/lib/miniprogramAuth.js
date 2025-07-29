import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 微信小程序认证中间件
export function miniprogramAuthMiddleware(handler) {
  return async (request) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: '未授权访问', code: 401 },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)
      
      if (!token) {
        return NextResponse.json(
          { error: 'token不能为空', code: 401 },
          { status: 401 }
        )
      }

      try {
        // 验证JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        
        // 将解码后的用户信息添加到request对象
        request.user = {
          id: decoded.userId,
          openid: decoded.openid,
          nickname: decoded.nickname
        }

        return handler(request)
      } catch (jwtError) {
        console.error('JWT验证失败:', jwtError)
        return NextResponse.json(
          { error: 'token无效或已过期', code: 401 },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('认证中间件错误:', error)
      return NextResponse.json(
        { error: '认证失败', code: 401 },
        { status: 401 }
      )
    }
  }
}

// 统一响应格式
export function createResponse(success = true, data = null, message = '', code = 200) {
  return NextResponse.json({
    success,
    data,
    message,
    code
  }, { status: code })
}

// 错误响应
export function createErrorResponse(message = '操作失败', code = 500) {
  return createResponse(false, null, message, code)
}

// 成功响应
export function createSuccessResponse(data = null, message = '操作成功') {
  return createResponse(true, data, message, 200)
} 