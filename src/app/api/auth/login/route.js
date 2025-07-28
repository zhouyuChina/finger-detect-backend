import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, wrapResponse } from '../../../../lib/middleware.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 10, 300) // 5分钟内最多10次登录尝试
    if (rateLimitResult) return rateLimitResult
    
    const body = await request.json()
    const { username, password } = body
    
    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: '用户名和密码是必填字段'
      }, { status: 400 })
    }
    
    // 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username }
    })
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: '用户名或密码错误'
      }, { status: 401 })
    }
    
    // 检查管理员状态
    if (!admin.isActive) {
      return NextResponse.json({
        success: false,
        message: '账户已被禁用'
      }, { status: 401 })
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: '用户名或密码错误'
      }, { status: 401 })
    }
    
    // 生成JWT令牌
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      secret,
      { expiresIn: '24h' }
    )
    
    // 更新最后登录时间
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    })
    
    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: admin.id,
        action: 'login',
        resource: 'admin',
        details: `管理员 ${admin.username} 登录成功`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })
    
    return wrapResponse({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    }, '登录成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 