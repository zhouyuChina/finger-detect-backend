import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取当前openid的所有档案列表
async function getAllArchives(request) {
  let prisma = null
  try {
    console.log('📁 获取所有档案列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    console.log('📋 当前微信用户openid:', request.user?.openid)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const filter = searchParams.get('filter') || 'all' // all, own, others
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 获取当前微信用户的所有子用户
    console.log('🔍 获取当前微信用户的所有子用户')
    
    const allSubUsers = await prisma.subUser.findMany({
      where: { 
        wechatUserId: request.user.id,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true,
        status: true,
        archives: true,
        photos: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    if (allSubUsers.length === 0) {
      console.log('❌ 当前微信用户没有子用户')
      return createSuccessResponse({
        ownArchives: [],
        otherArchives: [],
        totalOwn: 0,
        totalOthers: 0,
        subUsers: []
      }, '当前用户没有档案')
    }

    console.log('✅ 找到子用户数量:', allSubUsers.length)

    // 2. 获取所有档案
    const allArchives = await prisma.archive.findMany({
      where: {
        subUserId: { in: allSubUsers.map(u => u.id) }
      },
      select: {
        id: true,
        archiveName: true,
        activity: true,
        photoCount: true,
        bodyPart: true,
        detectionTime: true,
        createdAt: true,
        updatedAt: true,
        subUserId: true,
        subUser: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('✅ 找到档案数量:', allArchives.length)

    // 3. 为每个档案获取最新的检测图片
    const archivesWithImages = await Promise.all(
      allArchives.map(async (archive) => {
        // 查找该档案的最新检测记录
        const latestDetection = await prisma.detection.findFirst({
          where: {
            archiveName: archive.archiveName,
            subUserId: archive.subUserId
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
          status: archive.activity, // 使用 activity 作为 status
          totalDetections: archive.photoCount, // 使用 photoCount 作为 totalDetections
          bodyPart: archive.bodyPart,
          startDate: archive.createdAt, // 使用 createdAt 作为 startDate
          lastDetectionTime: archive.detectionTime, // 使用 detectionTime 作为 lastDetectionTime
          createdAt: archive.createdAt,
          updatedAt: archive.updatedAt,
          // 添加用户信息
          subUserId: archive.subUserId,
          username: archive.subUser.username,
          realName: archive.subUser.realName,
          // 添加图片信息
          imageUrl: latestDetection?.imageUrl || null,
          result: latestDetection?.result || null,
          confidence: latestDetection?.confidence || null,
          latestDetectionTime: latestDetection?.detectionTime || null
        }
      })
    )

    // 4. 区分本人档案和其他用户档案
    // 本人档案：第一个子用户的档案（通常是最早创建的）
    const ownSubUserId = allSubUsers[0]?.id
    const ownArchives = archivesWithImages.filter(archive => archive.subUserId === ownSubUserId)
    const otherArchives = archivesWithImages.filter(archive => archive.subUserId !== ownSubUserId)

    // 5. 根据过滤条件返回数据
    let filteredOwnArchives = ownArchives
    let filteredOtherArchives = otherArchives

    if (filter === 'own') {
      filteredOtherArchives = []
    } else if (filter === 'others') {
      filteredOwnArchives = []
    }

    // 6. 分页处理
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedOwnArchives = filteredOwnArchives.slice(startIndex, endIndex)
    const paginatedOtherArchives = filteredOtherArchives.slice(startIndex, endIndex)

    // 7. 构建响应数据
    const responseData = {
      ownArchives: paginatedOwnArchives,
      otherArchives: paginatedOtherArchives,
      totalOwn: filteredOwnArchives.length,
      totalOthers: filteredOtherArchives.length,
      totalAll: filteredOwnArchives.length + filteredOtherArchives.length,
      subUsers: allSubUsers.map(user => ({
        id: user.id,
        username: user.username,
        realName: user.realName,
        archives: user.archives,
        photos: user.photos,
        isOwn: user.id === ownSubUserId
      })),
      pagination: {
        page,
        limit,
        totalOwn: filteredOwnArchives.length,
        totalOthers: filteredOtherArchives.length,
        totalAll: filteredOwnArchives.length + filteredOtherArchives.length,
        totalPages: Math.ceil((filteredOwnArchives.length + filteredOtherArchives.length) / limit)
      },
      filter,
      ownSubUserId
    }

    console.log('✅ 获取档案列表成功')
    console.log('  - 本人档案数量:', filteredOwnArchives.length)
    console.log('  - 其他用户档案数量:', filteredOtherArchives.length)
    console.log('  - 子用户数量:', allSubUsers.length)

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

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getAllArchives) 