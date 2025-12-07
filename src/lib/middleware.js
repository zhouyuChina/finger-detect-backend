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
  // 统一使用JWT认证，不再区分开发和生产环境

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