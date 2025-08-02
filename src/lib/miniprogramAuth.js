import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 微信小程序认证中间件
export function miniprogramAuthMiddleware(handler) {
  return async (request) => {
    let prisma = null
    try {
      // 开发环境下临时跳过认证（用于测试）
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开发环境：临时跳过认证')
        
        const { PrismaClient } = await import('../generated/prisma/index.js')
        prisma = new PrismaClient()
        
        // 从请求头获取 openid
        const openidHeader = request.headers.get('x-openid')
        
        if (openidHeader) {
          // 如果提供了 openid，尝试查找用户
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
            // 用户不存在，使用第一个用户作为默认用户
            const firstUser = await prisma.user.findFirst()
            if (firstUser) {
              request.user = {
                id: firstUser.id,
                openid: firstUser.openid,
                nickname: firstUser.nickname
              }
              console.log('🔧 使用默认用户:', firstUser.nickname)
            } else {
              return NextResponse.json(
                { error: '数据库中没有用户，请先注册', code: 404 },
                { status: 404 }
              )
            }
          }
        } else {
          // 没有提供 openid，使用第一个用户作为默认用户
          const firstUser = await prisma.user.findFirst()
          if (firstUser) {
            request.user = {
              id: firstUser.id,
              openid: firstUser.openid,
              nickname: firstUser.nickname
            }
            console.log('🔧 使用默认用户:', firstUser.nickname)
          } else {
            return NextResponse.json(
              { error: '数据库中没有用户，请先注册', code: 404 },
              { status: 404 }
            )
          }
        }
        
        return handler(request)
      }
      
      // 生产环境下也跳过认证，但使用真实的 openid 查找用户
      if (process.env.NODE_ENV === 'production') {
        console.log('🔧 生产环境：跳过认证，使用 openid 查找用户')
        
        const { PrismaClient } = await import('../generated/prisma/index.js')
        prisma = new PrismaClient()
        
        // 从请求头获取 openid
        const openidHeader = request.headers.get('x-openid')
        
        if (openidHeader) {
          // 根据 openid 查找用户
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
        prisma = new PrismaClient()
        
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
      }
      // 方式2：使用 JWT token 认证（兼容旧版本）
      else if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('🔐 使用 JWT token 认证')
        
        const token = authHeader.substring(7)
        
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
          userInfo = {
            id: decoded.userId,
            openid: decoded.openid,
            nickname: decoded.nickname
          }
          console.log('✅ JWT token 认证成功:', userInfo.nickname)
        } catch (error) {
          console.log('❌ JWT token 验证失败:', error.message)
          return NextResponse.json(
            { error: 'Token 无效', code: 401 },
            { status: 401 }
          )
        }
      }
      // 没有提供任何认证信息
      else {
        console.log('❌ 没有提供认证信息')
        return NextResponse.json(
          { error: '请提供认证信息', code: 401 },
          { status: 401 }
        )
      }

      // 将用户信息添加到请求对象中
      request.user = userInfo
      
      // 调用实际的处理器
      return handler(request)
      
    } catch (error) {
      console.error('❌ 认证中间件错误:', error.message)
      console.error('错误堆栈:', error.stack)
      
      return NextResponse.json(
        { error: '认证失败', code: 500 },
        { status: 500 }
      )
    } finally {
      // 确保 Prisma 连接被正确关闭
      if (prisma) {
        try {
          await prisma.$disconnect()
        } catch (error) {
          console.error('关闭 Prisma 连接失败:', error)
        }
      }
    }
  }
}

// 创建响应数据的工具函数
export function createResponse(success = true, data = null, message = '', code = 200) {
  return {
    success,
    data,
    message,
    code
  }
}

// 创建错误响应的工具函数
export function createErrorResponse(message = '操作失败', code = 500) {
  return NextResponse.json(createResponse(false, null, message, code), { status: code })
}

// 创建成功响应的工具函数
export function createSuccessResponse(data = null, message = '操作成功') {
  return NextResponse.json(createResponse(true, data, message, 200))
} 