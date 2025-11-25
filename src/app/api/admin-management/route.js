import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../lib/db.js'
import { adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'
import { checkPermission, PERMISSIONS } from '../../../lib/permissionMiddleware.js'

// 获取管理员列表
export async function GET(request) {
  try {
    // 验证管理员身份
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // 权限检查：只有超级管理员可以查看管理员列表
    const permissionError = checkPermission(authResult, PERMISSIONS.SETTINGS_ADMIN_MANAGE, '查看管理员列表')
    if (permissionError) return permissionError

    const admins = await prisma.admin.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return wrapResponse(admins)
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}