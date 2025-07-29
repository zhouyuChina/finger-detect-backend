import { NextResponse } from 'next/server'

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
      
      // TODO: 验证JWT token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // request.user = decoded
      
      // 模拟验证
      if (!token || token === 'invalid_token') {
        return NextResponse.json(
          { error: 'token无效', code: 401 },
          { status: 401 }
        )
      }

      // 将用户信息添加到request对象
      request.user = {
        id: 1,
        openid: 'mock_openid',
        nickname: '微信用户'
      }

      return handler(request)
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