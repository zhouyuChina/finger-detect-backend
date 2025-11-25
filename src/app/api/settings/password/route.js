import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        message: '当前密码和新密码是必填字段'
      }, { status: 400 })
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: '新密码长度至少为6位'
      }, { status: 400 })
    }

    // 查找当前管理员
    const admin = await prisma.admin.findUnique({
      where: { id: authResult.userId }
    })

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: '管理员不存在'
      }, { status: 404 })
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        message: '当前密码不正确'
      }, { status: 401 })
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, admin.password)
    if (isSamePassword) {
      return NextResponse.json({
        success: false,
        message: '新密码不能与当前密码相同'
      }, { status: 400 })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: admin.id,
        action: 'update_password',
        resource: 'admin',
        details: `管理员 ${admin.username} 修改了密码`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }
    })

    return wrapResponse(null, '密码修改成功')

  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}