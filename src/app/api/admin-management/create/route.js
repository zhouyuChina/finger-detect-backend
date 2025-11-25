import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'
import { checkPermission, PERMISSIONS } from '../../../../lib/permissionMiddleware.js'
import bcrypt from 'bcryptjs'

// 创建管理员
export async function POST(request) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查：只有超级管理员可以创建管理员
    const permissionError = checkPermission(authResult, PERMISSIONS.SETTINGS_ADMIN_MANAGE, '创建管理员')
    if (permissionError) return permissionError

    const body = await request.json()
    const { username, email, password, name, role = 'admin', isActive = true, permissions = [] } = body

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: '用户名和密码不能为空'
      }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: '用户名已存在'
      }, { status: 400 })
    }

    // 如果提供了邮箱，检查邮箱是否已存在
    if (email && email.trim() !== '') {
      const existingEmail = await prisma.admin.findUnique({
        where: { email: email.trim() }
      })

      if (existingEmail) {
        return NextResponse.json({
          success: false,
          message: '邮箱已存在'
        }, { status: 400 })
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 准备创建数据，如果email为空则设为null
    const createData = {
      username,
      password: hashedPassword,
      name: name || username,
      email: email && email.trim() !== '' ? email.trim() : null,
      role,
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive
    }

    const newAdmin = await prisma.admin.create({
      data: createData,
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

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: authResult.userId,
        action: 'create_admin',
        resource: 'admin',
        details: `管理员 ${authResult.username} 创建了管理员 ${newAdmin.username}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })

    return wrapResponse(newAdmin, '管理员创建成功')
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}