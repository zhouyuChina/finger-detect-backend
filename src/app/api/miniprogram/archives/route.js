import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取档案列表
async function getArchives(request) {
  let prisma = null
  try {
    console.log('📁 获取档案列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    
    // 验证参数
    if (!username) {
      return createErrorResponse('请提供用户名参数', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 首先根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: request.user.id,
        username: username,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在，微信用户ID:', request.user.id, '用户名:', username)
      return createErrorResponse('用户不存在或无权限访问', 404)
    }

    console.log('✅ 找到子用户:', subUser.realName)

    // 2. 计算分页参数
    const skip = (page - 1) * limit

    // 3. 查询该子用户的档案列表
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where: {
          subUserId: subUser.id
        },
        select: {
          id: true,
          archiveName: true,
          activity: true,
          photoCount: true,
          bodyPart: true,
          detectionTime: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.archive.count({
        where: {
          subUserId: subUser.id
        }
      })
    ])

    console.log('✅ 获取档案列表成功，数量:', archives.length)

    // 4. 构建响应数据
    const responseData = {
      subUser: {
        id: subUser.id,
        username: subUser.username,
        realName: subUser.realName
      },
      archives: archives.map(archive => ({
        id: archive.id,
        archiveName: archive.archiveName,
        activity: archive.activity,
        photoCount: archive.photoCount,
        bodyPart: archive.bodyPart,
        detectionTime: archive.detectionTime,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return createSuccessResponse(responseData, '获取档案列表成功')

  } catch (error) {
    console.error('❌ 获取档案列表错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取档案列表失败')
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 创建新档案
async function createArchive(request) {
  let prisma = null
  try {
    console.log('➕ 创建档案接口被调用')
    
    const body = await request.json()
    const { 
      username,
      archiveName, 
      bodyPart = 'fingerprint',
      activity = 'medium',
      photoCount = 0
    } = body

    // 验证必填字段
    if (!username || !archiveName) {
      return createErrorResponse('用户名和档案名称为必填项', 400)
    }

    // 验证档案名称长度
    if (archiveName.length < 2 || archiveName.length > 50) {
      return createErrorResponse('档案名称长度应在2-50个字符之间', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: request.user.id,
        username: username,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在，微信用户ID:', request.user.id, '用户名:', username)
      return createErrorResponse('用户不存在或无权限操作', 404)
    }

    // 2. 检查档案名称是否已存在（在同一子用户下）
    const existingArchive = await prisma.archive.findFirst({
      where: {
        subUserId: subUser.id,
        archiveName: archiveName
      }
    })

    if (existingArchive) {
      return createErrorResponse('档案名称已存在', 400)
    }

    // 3. 创建新档案
    const newArchive = await prisma.archive.create({
      data: {
        subUserId: subUser.id,
        archiveName,
        bodyPart,
        activity,
        photoCount,
        detectionTime: new Date()
      },
      select: {
        id: true,
        subUserId: true,
        archiveName: true,
        bodyPart: true,
        activity: true,
        photoCount: true,
        detectionTime: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 4. 更新子用户的档案数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        archives: {
          increment: 1
        }
      }
    })

    console.log('✅ 档案创建成功:', newArchive.archiveName)

    return createSuccessResponse(newArchive, '档案创建成功')

  } catch (error) {
    console.error('❌ 创建档案错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('创建档案失败')
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getArchives)
export const POST = miniprogramAuthMiddleware(createArchive) 