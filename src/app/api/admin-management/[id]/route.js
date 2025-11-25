import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'
import { checkPermission, PERMISSIONS } from '../../../../lib/permissionMiddleware.js'
import bcrypt from 'bcryptjs'

// 获取单个管理员详情
export async function GET(request, { params }) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查：只有超级管理员可以查看管理员详情
    const permissionError = checkPermission(authResult, PERMISSIONS.SETTINGS_ADMIN_MANAGE, '查看管理员详情')
    if (permissionError) return permissionError

    const { id } = params

    // 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: '管理员不存在'
      }, { status: 404 })
    }

    return wrapResponse(admin)
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 更新管理员
export async function PUT(request, { params }) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查：只有超级管理员可以更新管理员
    const permissionError = checkPermission(authResult, PERMISSIONS.SETTINGS_ADMIN_MANAGE, '更新管理员')
    if (permissionError) return permissionError

    const { id } = params
    const body = await request.json()
    const { username, email, name, role, isActive, password } = body

    // 检查管理员是否存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { id }
    })

    if (!existingAdmin) {
      return NextResponse.json({
        success: false,
        message: '管理员不存在'
      }, { status: 404 })
    }

    // 验证用户名格式
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({
          success: false,
          message: '用户名长度必须在3-20个字符之间'
        }, { status: 400 })
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json({
          success: false,
          message: '用户名只能包含字母、数字和下划线'
        }, { status: 400 })
      }

      // 检查用户名是否与其他管理员冲突
      const usernameConflict = await prisma.admin.findUnique({
        where: { username }
      })

      if (usernameConflict && usernameConflict.id !== id) {
        return NextResponse.json({
          success: false,
          message: '用户名已存在'
        }, { status: 400 })
      }
    }

    // 验证邮箱格式
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({
          success: false,
          message: '邮箱格式不正确'
        }, { status: 400 })
      }

      // 检查邮箱是否与其他管理员冲突
      const emailConflict = await prisma.admin.findUnique({
        where: { email }
      })

      if (emailConflict && emailConflict.id !== id) {
        return NextResponse.json({
          success: false,
          message: '邮箱已存在'
        }, { status: 400 })
      }
    }

    // 验证角色
    const validRoles = ['admin', 'super_admin', 'operator']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        message: '无效的角色'
      }, { status: 400 })
    }

    // 准备更新数据
    let updateData = {
      ...(username && { username }),
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive }),
      updatedAt: new Date()
    }

    // 如果提供了新密码，则更新密码
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({
          success: false,
          message: '密码长度至少为6位'
        }, { status: 400 })
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    // 更新管理员
    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: authResult.userId,
        action: 'update_admin',
        resource: 'admin',
        details: `管理员 ${authResult.username} 更新了管理员 ${updatedAdmin.username} 的信息`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })

    return wrapResponse(updatedAdmin, '管理员信息更新成功')
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 删除管理员
export async function DELETE(request, { params }) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查：只有超级管理员可以删除管理员
    const permissionError = checkPermission(authResult, PERMISSIONS.SETTINGS_ADMIN_MANAGE, '删除管理员')
    if (permissionError) return permissionError

    const { id } = params

    // 检查是否是最后一个超级管理员
    if (authResult.userId === id) {
      const superAdminCount = await prisma.admin.count({
        where: { role: 'super_admin', isActive: true }
      })

      if (superAdminCount === 1) {
        return NextResponse.json({
          success: false,
          message: '不能删除最后一个超级管理员'
        }, { status: 400 })
      }
    }

    // 检查管理员是否存在
    const adminToDelete = await prisma.admin.findUnique({
      where: { id }
    })

    if (!adminToDelete) {
      return NextResponse.json({
        success: false,
        message: '管理员不存在'
      }, { status: 404 })
    }

    // 删除管理员
    await prisma.admin.delete({
      where: { id }
    })

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: authResult.userId,
        action: 'delete_admin',
        resource: 'admin',
        details: `管理员 ${authResult.username} 删除了管理员 ${adminToDelete.username}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })

    return wrapResponse(null, '管理员删除成功')
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}