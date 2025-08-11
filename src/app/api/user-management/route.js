import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取用户管理列表
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
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { realName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 查询数据
    const [subUsers, total] = await Promise.all([
      prisma.subUser.findMany({
        where,
        select: {
          id: true,
          wechatUserId: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          status: true,
          age: true,
          gender: true,
          address: true,
          archives: true,
          photos: true,
          reports: true,
          createdAt: true,
          updatedAt: true,
          remark: true,
          wechatUser: {
            select: {
              openid: true,
              nickname: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.subUser.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        data: subUsers,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取用户管理列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建用户记录
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const {
      wechatUserId,
      username,
      realName,
      phone,
      email,
      age,
      gender,
      address,
      status = 'active',
      remark
    } = body

    // 验证必填字段
    if (!wechatUserId || !username || !realName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段（微信用户ID、用户名、真实姓名）' },
        { status: 400 }
      )
    }

    // 验证微信用户是否存在
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { id: wechatUserId }
    })

    if (!wechatUser) {
      return NextResponse.json(
        { success: false, message: '微信用户不存在' },
        { status: 400 }
      )
    }

    // 检查当前微信用户的子用户数量
    const currentSubUserCount = await prisma.subUser.count({
      where: { 
        wechatUserId: wechatUserId
      }
    })

    // 限制每个微信号最多50个用户账号（包括自己的默认账号）
    if (currentSubUserCount >= 50) {
      return NextResponse.json(
        { success: false, message: '已达到最大用户数量限制（50个），无法创建更多用户账号' },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const existingSubUser = await prisma.subUser.findFirst({
      where: { username }
    })

    if (existingSubUser) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      )
    }

    // 创建子用户记录
    const subUser = await prisma.subUser.create({
      data: {
        wechatUserId,
        username,
        realName,
        phone,
        email,
        age,
        gender,
        address,
        status,
        remark,
        archives: 0,
        photos: 0,
        reports: 0
      }
    })

    return NextResponse.json({
      success: true,
      message: '子用户创建成功',
      data: subUser
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 