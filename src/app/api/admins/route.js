import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取管理员列表(只有超级管理员可以访问)
export async function GET(request) {
  try {
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 检查是否是超级管理员
    if (authResult.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: '只有超级管理员可以访问此功能' },
        { status: 403 }
      )
    }

    // 查询所有管理员
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

    return NextResponse.json({
      success: true,
      data: admins
    })
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败', error: error.message },
      { status: 500 }
    )
  }
}
