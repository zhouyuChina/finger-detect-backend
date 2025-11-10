import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取单个档案详情
async function getArchive(request, context = {}) {
  let prisma = null
  try {
    console.log('📁 获取档案详情接口被调用')

    const { params = {} } = context
    const { id } = await params

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询档案
    const archive = await prisma.archive.findUnique({
      where: { id },
      include: {
        subUser: {
          select: {
            id: true,
            username: true,
            realName: true,
            wechatUserId: true
          }
        }
      }
    })

    if (!archive) {
      return createErrorResponse('档案不存在', 404)
    }

    // 验证权限：档案的子用户必须属于当前微信用户
    if (archive.subUser.wechatUserId !== request.user.id) {
      return createErrorResponse('无权限访问此档案', 403)
    }

    // 获取该档案的最新检测记录（使用 archiveId）
    const latestDetection = await prisma.detection.findFirst({
      where: {
        archiveId: id
      },
      select: {
        imageUrl: true,
        result: true,
        confidence: true,
        detectionTime: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // 构建响应数据
    const responseData = {
      id: archive.id,
      archiveName: archive.archiveName,
      status: archive.activity,
      totalDetections: archive.photoCount,
      bodyPart: archive.bodyPart,
      startDate: archive.createdAt,
      lastDetectionTime: archive.detectionTime,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
      // 添加图片信息
      imageUrl: latestDetection?.imageUrl || null,
      result: latestDetection?.result || null,
      confidence: latestDetection?.confidence || null,
      latestDetectionTime: latestDetection?.detectionTime || null
    }

    console.log('✅ 获取档案详情成功')
    return createSuccessResponse(responseData, '获取档案详情成功')

  } catch (error) {
    console.error('❌ 获取档案详情错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`获取档案详情失败: ${error.message}`)
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 更新档案信息
async function updateArchive(request, context = {}) {
  let prisma = null
  try {
    console.log('✏️ 更新档案接口被调用')

    const { params = {} } = context
    const { id } = await params
    const body = await request.json()
    console.log('📋 请求数据:', JSON.stringify(body, null, 2))

    const { archiveName, bodyPart, activity } = body

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询档案
    const archive = await prisma.archive.findUnique({
      where: { id },
      include: {
        subUser: {
          select: {
            id: true,
            wechatUserId: true
          }
        }
      }
    })

    if (!archive) {
      return createErrorResponse('档案不存在', 404)
    }

    // 验证权限：档案的子用户必须属于当前微信用户
    if (archive.subUser.wechatUserId !== request.user.id) {
      return createErrorResponse('无权限修改此档案', 403)
    }

    // 如果要修改档案名称，检查是否与该子用户的其他档案重名
    if (archiveName && archiveName !== archive.archiveName) {
      const existingArchive = await prisma.archive.findFirst({
        where: {
          subUserId: archive.subUserId,
          archiveName: archiveName,
          id: { not: id }
        }
      })

      if (existingArchive) {
        return createErrorResponse('档案名称已存在', 409)
      }
    }

    // 构建更新数据对象
    const updateData = {}
    if (archiveName !== undefined) updateData.archiveName = archiveName
    if (bodyPart !== undefined) updateData.bodyPart = bodyPart
    if (activity !== undefined) updateData.activity = activity

    // 更新档案
    const updatedArchive = await prisma.archive.update({
      where: { id },
      data: updateData
    })

    console.log('✅ 档案更新成功')
    return createSuccessResponse(updatedArchive, '档案更新成功')

  } catch (error) {
    console.error('❌ 更新档案错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`更新档案失败: ${error.message}`)
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 删除档案
async function deleteArchive(request, context = {}) {
  let prisma = null
  try {
    console.log('🗑️ 删除档案接口被调用')

    const { params = {} } = context
    const { id } = await params

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 查询档案
    const archive = await prisma.archive.findUnique({
      where: { id },
      include: {
        subUser: {
          select: {
            id: true,
            wechatUserId: true,
            archives: true,
            photos: true
          }
        }
      }
    })

    if (!archive) {
      return createErrorResponse('档案不存在', 404)
    }

    // 验证权限：档案的子用户必须属于当前微信用户
    if (archive.subUser.wechatUserId !== request.user.id) {
      return createErrorResponse('无权限删除此档案', 403)
    }

    // 统计该档案的检测记录数量（使用 archiveId）
    const detectionCount = await prisma.detection.count({
      where: {
        archiveId: id
      }
    })

    // 删除该档案关联的所有检测记录（使用 archiveId）
    await prisma.detection.deleteMany({
      where: {
        archiveId: id
      }
    })

    // 删除档案
    await prisma.archive.delete({
      where: { id }
    })

    // 更新子用户的档案数量和拍照数量（确保不会小于0）
    const currentArchives = archive.subUser.archives
    const currentPhotos = archive.subUser.photos

    await prisma.subUser.update({
      where: { id: archive.subUserId },
      data: {
        archives: Math.max(0, currentArchives - 1),
        photos: Math.max(0, currentPhotos - detectionCount)
      }
    })

    console.log('✅ 档案删除成功，同时删除了', detectionCount, '条检测记录')
    return createSuccessResponse(
      { deletedDetections: detectionCount },
      '档案删除成功'
    )

  } catch (error) {
    console.error('❌ 删除档案错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`删除档案失败: ${error.message}`)
  } finally {
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
export const GET = miniprogramAuthMiddleware(getArchive)
export const PUT = miniprogramAuthMiddleware(updateArchive)
export const DELETE = miniprogramAuthMiddleware(deleteArchive)
