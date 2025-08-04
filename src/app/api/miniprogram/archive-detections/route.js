import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取指定档案的所有检测记录
async function getArchiveDetections(request) {
  let prisma = null
  try {
    console.log('📁 获取档案检测记录接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    console.log('📋 当前微信用户openid:', request.user?.openid)
    
    const { searchParams } = new URL(request.url)
    const archiveName = searchParams.get('archiveName')
    const username = searchParams.get('username')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // 验证必填参数
    if (!archiveName) {
      return createErrorResponse('请提供档案名称参数', 400)
    }
    
    if (!username) {
      return createErrorResponse('请提供用户名参数', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 根据openid和用户名找到对应的子用户
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

    // 2. 查找指定的档案
    console.log('🔍 查找档案:', archiveName)
    
    const archive = await prisma.archive.findFirst({
      where: {
        subUserId: subUser.id,
        archiveName: archiveName
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
      }
    })

    if (!archive) {
      console.log('❌ 档案不存在:', archiveName)
      return createErrorResponse('档案不存在或无权限访问', 404)
    }

    console.log('✅ 找到档案:', archive.archiveName)

    // 3. 计算分页参数
    const skip = (page - 1) * limit

    // 4. 获取该档案的所有检测记录
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where: {
          subUserId: subUser.id,
          archiveName: archiveName
        },
        select: {
          id: true,
          archiveName: true,
          detectionType: true,
          imageUrl: true,
          result: true,
          confidence: true,
          status: true,
          errorMsg: true,
          remark: true,
          detectionTime: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.detection.count({
        where: {
          subUserId: subUser.id,
          archiveName: archiveName
        }
      })
    ])

    console.log('✅ 获取检测记录成功，数量:', detections.length)

    // 5. 构建检测报告
    const detectionReport = {
      archive: {
        id: archive.id,
        archiveName: archive.archiveName,
        status: archive.activity,
        totalDetections: archive.photoCount,
        bodyPart: archive.bodyPart,
        startDate: archive.createdAt,
        lastDetectionTime: archive.detectionTime,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt
      },
      statistics: {
        totalDetections: total,
        normalCount: detections.filter(d => d.result === 'normal').length,
        abnormalCount: detections.filter(d => d.result === 'abnormal').length,
        averageConfidence: detections.length > 0 
          ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
          : 0,
        latestDetection: detections.length > 0 ? detections[0] : null
      },
      detections: detections.map(detection => ({
        id: detection.id,
        archiveName: detection.archiveName,
        detectionType: detection.detectionType,
        imageUrl: detection.imageUrl,
        result: detection.result,
        confidence: detection.confidence,
        status: detection.status,
        errorMsg: detection.errorMsg,
        remark: detection.remark,
        detectionTime: detection.detectionTime,
        createdAt: detection.createdAt,
        updatedAt: detection.updatedAt
      }))
    }

    // 6. 构建图片数组（按时间顺序排列，最新的在前）
    const imageArray = detections
      .filter(detection => detection.imageUrl) // 只包含有图片的检测记录
      .map(detection => ({
        id: detection.id,
        imageUrl: detection.imageUrl,
        result: detection.result,
        confidence: detection.confidence,
        detectionTime: detection.detectionTime,
        createdAt: detection.createdAt,
        remark: detection.remark
      }))

    // 7. 构建响应数据
    const responseData = {
      // 第一部分：检测报告
      report: detectionReport,
      
      // 第二部分：图片数组
      images: imageArray,
      
      // 分页信息
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      
      // 用户信息
      subUser: {
        id: subUser.id,
        username: subUser.username,
        realName: subUser.realName
      }
    }

    console.log('✅ 构建响应数据成功')
    console.log('  - 检测记录总数:', total)
    console.log('  - 图片数量:', imageArray.length)
    console.log('  - 正常检测数:', detectionReport.statistics.normalCount)
    console.log('  - 异常检测数:', detectionReport.statistics.abnormalCount)

    return createSuccessResponse(responseData, '获取档案检测记录成功')

  } catch (error) {
    console.error('❌ 获取档案检测记录错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`获取档案检测记录失败: ${error.message}`)
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
export const GET = miniprogramAuthMiddleware(getArchiveDetections) 