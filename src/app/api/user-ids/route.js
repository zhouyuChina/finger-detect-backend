import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取ID管理列表
export async function GET(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const pageSize = parseInt(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {}
    
    if (status) {
      where.verifyStatus = status
    }
    
    if (search) {
      where.OR = [
        { realName: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
        { user: { nickname: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 查询数据
    const [userIds, total] = await Promise.all([
      prisma.userId.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true
            }
          },
          verifyAdmin: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.userId.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: userIds,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取ID管理列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建ID管理记录（通常由微信小程序调用）
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const body = await request.json()
    const {
      userId,
      idNumber,
      realName,
      idCardFront,
      idCardBack,
      idCardHand
    } = body

    // 验证必填字段
    if (!userId || !idNumber || !realName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查是否已存在ID记录
    const existingId = await prisma.userId.findUnique({
      where: { userId }
    })

    if (existingId) {
      return NextResponse.json(
        { success: false, message: '该用户已存在ID记录' },
        { status: 400 }
      )
    }

    // 创建ID记录
    const userIdRecord = await prisma.userId.create({
      data: {
        userId,
        idNumber,
        realName,
        idCardFront,
        idCardBack,
        idCardHand,
        verifyStatus: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ID记录创建成功',
      data: userIdRecord
    })
  } catch (error) {
    console.error('创建ID记录失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 