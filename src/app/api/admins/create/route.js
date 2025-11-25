import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { adminAuthMiddleware } from '../../../../../src/lib/middleware.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 创建管理员(只有超级管理员可以操作)
export async function POST(request) {
  try {
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 检查是否是超级管理员
    if (authResult.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: '只有超级管理员可以创建管理员' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, email, password, name, role = 'admin' } = body

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.admin.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: '邮箱已存在' },
          { status: 400 }
        )
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建管理员
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name: name || username,
        email,
        role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '管理员创建成功',
      data: admin
    })
  } catch (error) {
    console.error('创建管理员失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败: ' + error.message },
      { status: 500 }
    )
  }
}
