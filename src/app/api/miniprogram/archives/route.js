import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取档案列表
async function getArchives(request) {
  let prisma = null
  try {
    console.log('📁 获取档案列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    console.log('📋 当前微信用户openid:', request.user?.openid)
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    console.log('📋 请求的用户名:', username)
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
    console.log('🔍 查找子用户，微信用户ID:', request.user.id, '用户名:', username)
    
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
      
      // 检查所有子用户
      const allSubUsers = await prisma.subUser.findMany({
        where: { wechatUserId: request.user.id },
        select: { id: true, username: true, realName: true, status: true }
      })
      console.log('📋 该微信用户的所有子用户:', allSubUsers)
      
      return createErrorResponse('用户不存在或无权限访问', 404)
    }

    console.log('✅ 找到子用户:', subUser.realName)

    // 2. 计算分页参数
    const skip = (page - 1) * limit

    // 3. 查询该子用户的档案列表，同时获取每个档案的最新检测图片
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where: {
          subUserId: subUser.id
        },
        select: {
          id: true,
          archiveName: true,
          status: true,
          totalDetections: true,
          bodyPart: true,
          startDate: true,
          lastDetectionTime: true,
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

    // 4. 为每个档案获取最新的检测图片
    const archivesWithImages = await Promise.all(
      archives.map(async (archive) => {
        // 查找该档案的最新检测记录
        const latestDetection = await prisma.detection.findFirst({
          where: {
            archiveId: archive.id
          },
          select: {
            imageUrl: true,
            result: true,
            confidence: true,
            detectionTime: true
          },
          orderBy: { createdAt: 'desc' }
        })

        return {
          id: archive.id,
          archiveName: archive.archiveName,
          status: archive.status,
          totalDetections: archive.totalDetections,
          bodyPart: archive.bodyPart,
          startDate: archive.startDate,
          lastDetectionTime: archive.lastDetectionTime,
          createdAt: archive.createdAt,
          updatedAt: archive.updatedAt,
          // 添加图片信息
          imageUrl: latestDetection?.imageUrl || null,
          result: latestDetection?.result || null,
          confidence: latestDetection?.confidence || null,
          latestDetectionTime: latestDetection?.detectionTime || null
        }
      })
    )

    console.log('✅ 获取档案列表成功，数量:', archivesWithImages.length)

    // 5. 构建响应数据
    const responseData = {
      subUser: {
        id: subUser.id,
        username: subUser.username,
        realName: subUser.realName
      },
      archives: archivesWithImages,
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
    return createErrorResponse(`获取档案列表失败: ${error.message}`)
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
    console.log('📋 请求数据:', JSON.stringify(body, null, 2))
    
    const { 
      username,
      archiveName, 
      bodyPart = 'left_hand_thumb',
      imageUrl
    } = body

    // 验证必填字段
    if (!username || !archiveName) {
      return createErrorResponse('用户名和档案名称为必填项', 400)
    }

    // 验证检测类型
    const validTypes = [
      'left_hand_thumb', 'left_hand_index', 'left_hand_middle', 'left_hand_ring', 'left_hand_little',
      'right_hand_thumb', 'right_hand_index', 'right_hand_middle', 'right_hand_ring', 'right_hand_little',
      'left_foot_big', 'left_foot_second', 'left_foot_third', 'left_foot_fourth', 'left_foot_little',
      'right_foot_big', 'right_foot_second', 'right_foot_third', 'right_foot_fourth', 'right_foot_little'
    ]
    if (!validTypes.includes(bodyPart)) {
      return createErrorResponse('检测类型无效', 400)
    }

    // 验证图片URL格式（如果提供了的话）
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/uploads/')) {
      return createErrorResponse('图片URL格式不正确', 400)
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

    // 3. 先创建档案
    const newArchive = await prisma.archive.create({
      data: {
        subUserId: subUser.id,
        archiveName,
        bodyPart,
        status: 'active',
        startDate: new Date(),
        totalDetections: 1
      },
      select: {
        id: true,
        subUserId: true,
        archiveName: true,
        bodyPart: true,
        status: true,
        startDate: true,
        totalDetections: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 4. 创建检测记录（如果提供了图片URL）
    let newDetection = null
    if (imageUrl) {
      newDetection = await prisma.detection.create({
        data: {
          subUserId: subUser.id,
          archiveId: newArchive.id,
          detectionType: bodyPart,
          imageUrl,
          result: 'normal', // 默认结果
          confidence: 0.9, // 默认置信度
          status: 'completed',
          detectionTime: new Date()
        },
        select: {
          id: true,
          archiveId: true,
          detectionType: true,
          imageUrl: true,
          result: true,
          confidence: true,
          status: true,
          detectionTime: true,
          createdAt: true
        }
      })
    }

    // 5. 更新档案的最后检测时间（如果有检测记录）
    if (newDetection) {
      await prisma.archive.update({
        where: { id: newArchive.id },
        data: { lastDetectionTime: new Date() }
      })
    }

    // 6. 更新子用户的档案数量和拍照数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        archives: {
          increment: 1
        },
        photos: {
          increment: newDetection ? 1 : 0
        }
      }
    })

    console.log('✅ 档案创建成功:', newArchive.archiveName)
    console.log('✅ 检测记录创建成功:', newDetection.id)

    // 5. 构建响应数据
    const responseData = {
      archive: newArchive,
      detection: newDetection
    }

    return createSuccessResponse(responseData, '档案创建成功')

  } catch (error) {
    console.error('❌ 创建档案错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`创建档案失败: ${error.message}`)
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