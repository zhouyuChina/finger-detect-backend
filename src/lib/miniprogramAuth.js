import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 微信小程序认证中间件
export function miniprogramAuthMiddleware(handler) {
  return async (request) => {
    try {
      // 开发环境下也使用真实的 openid 查找用户
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开发环境：使用 openid 查找用户')
        
        // 从请求头获取 openid
        const openidHeader = request.headers.get('x-openid')
        
        if (openidHeader) {
          try {
            // 根据 openid 查找用户
            const { PrismaClient } = await import('../generated/prisma/index.js')
            const prisma = new PrismaClient()
            
            const user = await prisma.user.findUnique({
              where: { openid: openidHeader }
            })
            
            if (user) {
              request.user = {
                id: user.id,
                openid: user.openid,
                nickname: user.nickname
              }
              console.log('✅ 找到用户:', user.nickname)
            } else {
              console.log('❌ 用户不存在，openid:', openidHeader)
              return NextResponse.json(
                { error: '用户不存在，请先注册', code: 404 },
                { status: 404 }
              )
            }
            
            await prisma.$disconnect()
          } catch (error) {
            console.error('查找用户失败:', error)
            return NextResponse.json(
              { error: '数据库查询失败', code: 500 },
              { status: 500 }
            )
          }
        } else {
          // 没有提供 openid，返回错误
          return NextResponse.json(
            { error: '请提供 openid', code: 401 },
            { status: 401 }
          )
        }
        
        return handler(request)
      }
      
      // 生产环境下也跳过认证，但使用真实的 openid 查找用户
      if (process.env.NODE_ENV === 'production') {
        console.log('🔧 生产环境：跳过认证，使用 openid 查找用户')
        
        // 从请求头获取 openid
        const openidHeader = request.headers.get('x-openid')
        
        if (openidHeader) {
          try {
            // 根据 openid 查找用户
            const { PrismaClient } = await import('../generated/prisma/index.js')
            const prisma = new PrismaClient()
            
            const user = await prisma.user.findUnique({
              where: { openid: openidHeader }
            })
            
            if (user) {
              request.user = {
                id: user.id,
                openid: user.openid,
                nickname: user.nickname
              }
              console.log('✅ 找到用户:', user.nickname)
            } else {
              console.log('❌ 用户不存在，openid:', openidHeader)
              return NextResponse.json(
                { error: '用户不存在，请先注册', code: 404 },
                { status: 404 }
              )
            }
            
            await prisma.$disconnect()
          } catch (error) {
            console.error('查找用户失败:', error)
            return NextResponse.json(
              { error: '数据库查询失败', code: 500 },
              { status: 500 }
            )
          }
        } else {
          // 没有提供 openid，返回错误
          return NextResponse.json(
            { error: '请提供 openid', code: 401 },
            { status: 401 }
          )
        }
        
        return handler(request)
      }

      // 支持两种认证方式：openid 和 token
      const authHeader = request.headers.get('authorization')
      const openidHeader = request.headers.get('x-openid') // 新增：支持 openid header
      
      let userInfo = null

      // 方式1：使用 openid 认证（推荐）
      if (openidHeader) {
        console.log('🔐 使用 openid 认证:', openidHeader)
        
        // 根据 openid 查找用户
        const { PrismaClient } = await import('../generated/prisma/index.js')
        const prisma = new PrismaClient()
        
        try {
          const user = await prisma.user.findUnique({
            where: { openid: openidHeader }
          })
          
          if (user) {
            userInfo = {
              id: user.id,
              openid: user.openid,
              nickname: user.nickname
            }
            console.log('✅ openid 认证成功:', userInfo.nickname)
          } else {
            console.log('❌ 用户不存在，openid:', openidHeader)
            return NextResponse.json(
              { error: '用户不存在', code: 401 },
              { status: 401 }
            )
          }
        } finally {
          await prisma.$disconnect()
        }
      }
      // 方式2：使用 JWT token 认证（兼容旧版本）
      else if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('🔐 使用 JWT token 认证')
        
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
          
          userInfo = {
            id: decoded.userId,
            openid: decoded.openid,
            nickname: decoded.nickname
          }
          
          console.log('✅ JWT 认证成功:', userInfo.nickname)
        } catch (jwtError) {
          console.error('JWT验证失败:', jwtError)
          return NextResponse.json(
            { error: 'token无效或已过期', code: 401 },
            { status: 401 }
          )
        }
      }
      // 没有提供认证信息
      else {
        return NextResponse.json(
          { error: '未提供认证信息，请提供 openid 或 token', code: 401 },
          { status: 401 }
        )
      }

      // 将用户信息添加到request对象
      request.user = userInfo

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