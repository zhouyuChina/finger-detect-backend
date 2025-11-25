import { NextResponse } from 'next/server'
import { rateLimit } from './redis.js'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

// 限流中间件
export async function rateLimitMiddleware(request, limit = 100, windowSeconds = 60) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `rate_limit:${ip}`
  
  const result = await rateLimit(key, limit, windowSeconds)
  
  if (!result.allowed) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    )
  }
  
  return null
}

// JWT验证中间件
export function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}

// 管理员认证中间件
export async function adminAuthMiddleware(request) {
  // 开发环境下：优先使用JWT认证，但提供回退机制
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 开发环境：尝试JWT认证')

    // 首先尝试标准的JWT认证流程
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (token) {
      console.log('📌 发现JWT Token，尝试验证...')
      const decoded = verifyToken(token)

      if (decoded) {
        try {
          // 从数据库查询管理员完整信息
          const admin = await prisma.admin.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              permissions: true,
              isActive: true
            }
          })

          if (admin) {
            console.log(`✅ JWT认证成功：${admin.username} (${admin.role})`)
            // 正常记录最后登录时间
            await prisma.admin.update({
              where: { id: admin.id },
              data: { lastLogin: new Date() }
            })

            return {
              userId: admin.id,
              username: admin.username,
              name: admin.name,
              email: admin.email,
              phone: admin.phone,
              role: admin.role,
              permissions: admin.permissions || [],
              isActive: admin.isActive
            }
          }
        } catch (error) {
          console.error('JWT验证失败:', error)
        }
      } else {
        console.log('❌ JWT Token无效，进入开发模式回退机制')
      }
    } else {
      console.log('⚠️  未提供JWT Token，进入开发模式回退机制')
    }

    // JWT认证失败时的回退逻辑
    console.log('🔧 开发模式回退：尝试使用默认管理员')

    try {
      // 先尝试查找超级管理员
      let admin = await prisma.admin.findFirst({
        where: {
          isActive: true,
          role: 'super_admin'
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          permissions: true,
          isActive: true
        }
      })

      // 如果没有超级管理员，使用任意激活的管理员
      if (!admin) {
        admin = await prisma.admin.findFirst({
          where: { isActive: true },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            permissions: true,
            isActive: true
          }
        })
      }

      if (admin) {
        console.log(`🔄 开发回退模式：使用管理员 ${admin.username} (${admin.role})`)
        console.log('💡 提示：如需使用JWT认证，请确保提供有效的Bearer Token')
        return {
          userId: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions || [],
          isActive: admin.isActive
        }
      }
    } catch (error) {
      console.error('查询管理员失败:', error)
    }

    // 最终回退：创建默认管理员
    console.log('⚠️  使用默认开发管理员')
    console.log('📝 建议：请确保至少有一个有效的管理员账户用于测试')
    return { userId: 'dev-admin', username: 'admin', name: '开发管理员', role: 'super_admin', isActive: true, phone: null }
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { error: '未提供认证令牌' },
      { status: 401 }
    )
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json(
      { error: '无效的认证令牌' },
      { status: 401 }
    )
  }

  // 从数据库查询管理员完整信息
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: '管理员不存在' },
        { status: 404 }
      )
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: '账户已被禁用' },
        { status: 403 }
      )
    }

    // 更新最后登录时间
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    })

    return {
      userId: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      permissions: admin.permissions || [],
      isActive: admin.isActive
    }
  } catch (error) {
    console.error('认证失败:', error)
    return NextResponse.json(
      { error: '认证失败' },
      { status: 500 }
    )
  }
}

// CORS中间件
export function corsMiddleware(request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: '不允许的源' },
      { status: 403 }
    )
  }
  
  return null
}

// 错误处理中间件
export function errorHandler(error) {
  console.error('API错误:', error)
  
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { error: '数据验证失败', details: error.message },
      { status: 400 }
    )
  }
  
  if (error.name === 'UnauthorizedError') {
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    )
  }
  
  return NextResponse.json(
    { error: '服务器内部错误' },
    { status: 500 }
  )
}

// 请求日志中间件
export function logRequest(request) {
  const { method, url } = request
  const timestamp = new Date().toISOString()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`)
}

// 响应包装中间件
export function wrapResponse(data, message = 'success', status = 200) {
  return NextResponse.json({
    success: status < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  }, { status })
} 