import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取档案列表
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
    const searchUserId = searchParams.get('searchUserId') || ''
    const searchUserName = searchParams.get('searchUserName') || ''
    const searchArchiveName = searchParams.get('searchArchiveName') || ''
    const searchActivity = searchParams.get('searchActivity') || ''
    const searchBodyPartType = searchParams.get('searchBodyPartType') || ''
    const searchBodyPartDetail = searchParams.get('searchBodyPartDetail') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {
      subUser: {
        wechatUser: {}
      }
    }
    
    if (searchUserId) {
      where.subUser.wechatUser.openid = { contains: searchUserId, mode: 'insensitive' }
    }
    
    if (searchUserName) {
      where.subUser.realName = { contains: searchUserName, mode: 'insensitive' }
    }
    
    if (searchArchiveName) {
      where.archiveName = { contains: searchArchiveName, mode: 'insensitive' }
    }
    
    if (searchActivity) {
      where.activity = searchActivity
    }
    
    if (searchBodyPartType) {
      where.bodyPart = { startsWith: searchBodyPartType, mode: 'insensitive' }
    }
    
    if (searchBodyPartDetail) {
      where.bodyPart = { contains: searchBodyPartDetail, mode: 'insensitive' }
    }

    // 查询数据
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where,
        include: {
          subUser: {
            include: {
              wechatUser: {
                select: {
                  openid: true,
                  nickname: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.archive.count({ where })
    ])

    // 处理数据格式
    const formattedArchives = archives.map(archive => ({
      id: archive.id,
      archiveName: archive.archiveName,
      activity: archive.activity,
      photoCount: archive.photoCount,
      bodyPart: archive.bodyPart,
      detectionTime: archive.detectionTime,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
      // 用户信息
      userId: archive.subUser.wechatUser.openid,
      userNickname: archive.subUser.realName || archive.subUser.wechatUser.nickname,
      subUserId: archive.subUserId
    }))

    return NextResponse.json({
      success: true,
      data: {
        data: formattedArchives,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取档案列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建档案记录
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
      userId,
      userNickname,
      archiveName,
      activity = 'active',
      photoCount = 0,
      bodyPart = 'left_hand_thumb'
    } = body

    // 验证必填字段
    if (!userId || !userNickname || !archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 查找对应的 subUser
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUser: {
          openid: userId
        },
        realName: userNickname
      }
    })

    if (!subUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 400 }
      )
    }

    // 创建档案记录
    const archive = await prisma.archive.create({
      data: {
        archiveName,
        activity,
        photoCount,
        bodyPart,
        subUserId: subUser.id
      }
    })

    return NextResponse.json({
      success: true,
      message: '档案创建成功',
      data: archive
    })
  } catch (error) {
    console.error('创建档案失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 