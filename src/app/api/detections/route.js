import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取检测记录列表
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
    const openid = searchParams.get('openid') || ''
    const userName = searchParams.get('userName') || ''
    const archiveId = searchParams.get('archiveId') || ''

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where = {
      isFirstReport: true  // 只查询有检测报告的记录
    }
    
    if (archiveId) {
      where.archiveId = archiveId
    }

    // 如果搜索 openid 或 userName，需要关联查询
    if (openid || userName) {
      where.subUser = {}
      if (openid) {
        where.subUser.wechatUser = {
          openid: { contains: openid, mode: 'insensitive' }
        }
      }
      if (userName) {
        where.subUser.realName = { contains: userName, mode: 'insensitive' }
      }
    }

    // 查询数据，包含关联的用户信息和档案信息
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where,
        include: {
          subUser: {
            include: {
              wechatUser: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.detection.count({ where })
    ])

    // 转换数据格式以匹配前端期望
    const formattedDetections = detections.map(detection => ({
      id: detection.id,
      openid: detection.subUser?.wechatUser?.openid || '未知',
      userName: detection.subUser?.realName || detection.subUser?.wechatUser?.nickname || '未知',
      archiveName: detection.archiveName,
      archiveId: detection.archiveId || '未知',
      imageUrl: detection.imageUrl,
      result: detection.result,
      confidence: detection.confidence,
      status: detection.status,
      detectionTime: detection.detectionTime,
      createdAt: detection.createdAt,
      updatedAt: detection.updatedAt,
      isFirstReport: detection.isFirstReport
    }))

    return NextResponse.json({
      success: true,
      data: {
        data: formattedDetections,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    })
  } catch (error) {
    console.error('获取检测记录列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建检测记录
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
      bodyPart = 'left_hand_thumb',
      imageUrl,
      result,
      confidence,
      status = 'pending'
    } = body

    // 验证必填字段
    if (!userId || !userNickname || !archiveName) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 查找或创建SubUser
    let subUser = await prisma.subUser.findFirst({
      where: {
        username: userId
      },
      include: {
        wechatUser: true
      }
    })

    if (!subUser) {
      // 如果没有找到用户，创建一个默认的WechatUser和SubUser
      const wechatUser = await prisma.wechatUser.create({
        data: {
          openid: `admin_created_${Date.now()}`,
          nickname: userNickname
        }
      })

      subUser = await prisma.subUser.create({
        data: {
          wechatUserId: wechatUser.id,
          username: userId,
          realName: userNickname
        }
      })
    }

    // 检查档案是否已存在
    const existingArchive = await prisma.archive.findUnique({
      where: {
        subUserId_archiveName: {
          subUserId: subUser.id,
          archiveName: archiveName
        }
      }
    })

    // 检查是否已有检测记录
    const existingDetections = await prisma.detection.findMany({
      where: {
        subUserId: subUser.id,
        archiveName: archiveName,
        status: 'completed'
      },
      select: {
        id: true,
        result: true,
        confidence: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    let isNewArchive = false
    let archive

    if (existingArchive) {
      // 档案已存在，检查是否已有报告
      if (existingDetections.length > 0) {
        // 已有报告，这是治疗过程中的拍照，不生成新报告
        console.log('📸 档案已存在且有报告，这是治疗过程中的拍照')
        
        // 只更新档案的照片数量，不创建新的检测记录
        archive = await prisma.archive.update({
          where: {
            subUserId_archiveName: {
              subUserId: subUser.id,
              archiveName: archiveName
            }
          },
          data: {
            photoCount: {
              increment: 1
            },
            detectionTime: new Date(),
            updatedAt: new Date()
          }
        })

        // 更新子用户的拍照数量
        await prisma.subUser.update({
          where: { id: subUser.id },
          data: {
            photos: {
              increment: 1
            }
          }
        })

        return NextResponse.json({
          success: true,
          message: '治疗过程拍照完成，照片已保存',
          data: {
            archive: {
              id: archive.id,
              archiveName: archive.archiveName,
              photoCount: archive.photoCount,
              detectionTime: archive.detectionTime,
              updatedAt: archive.updatedAt
            },
            isTreatmentPhoto: true
          }
        })
      } else {
        // 档案存在但没有检测记录，创建第一份报告
        console.log('📋 档案存在但无报告，创建第一份报告')
        isNewArchive = false
      }
    } else {
      // 新档案，创建第一份报告
      console.log('🆕 新档案，创建第一份报告')
      isNewArchive = true
    }

    // 创建或更新档案记录
    if (isNewArchive) {
      archive = await prisma.archive.create({
        data: {
          subUserId: subUser.id,
          archiveName,
          bodyPart: bodyPart,
          activity: 'medium',
          photoCount: 0,
          detectionTime: new Date()
        }
      })
    } else {
      // 更新现有档案
      archive = await prisma.archive.update({
        where: {
          subUserId_archiveName: {
            subUserId: subUser.id,
            archiveName: archiveName
          }
        },
        data: {
          photoCount: {
            increment: 1
          },
          detectionTime: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // 创建检测记录（第一份报告）
    const detection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName,
        archiveId: archive.id,
        detectionType: bodyPart,
        imageUrl: imageUrl || '',
        result: result || '',
        confidence: confidence || 0,
        status: status || 'completed',
        isFirstReport: true  // 标记为首次报告
      }
    })

    // 更新子用户的检测数量和拍照数量
    await prisma.subUser.update({
      where: { id: subUser.id },
      data: {
        reports: {
          increment: 1  // 只有创建报告时才增加
        },
        photos: {
          increment: 1
        },
        archives: {
          increment: isNewArchive ? 1 : 0  // 只有新档案才增加计数
        }
      }
    })

    // 转换数据格式
    const formattedDetection = {
      id: detection.id,
      openid: subUser.wechatUser?.openid || '未知',
      userName: subUser.realName || subUser.wechatUser?.nickname || '未知',
      archiveName: detection.archiveName,
      archiveId: detection.archiveId || '未知',
      imageUrl: detection.imageUrl,
      result: detection.result,
      confidence: detection.confidence,
      status: detection.status,
      detectionTime: detection.detectionTime,
      createdAt: detection.createdAt,
      updatedAt: detection.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: '检测记录创建成功',
      data: formattedDetection,
      isFirstReport: true
    })
  } catch (error) {
    console.error('创建检测记录失败:', error)
    return NextResponse.json(
      { success: false, message: '创建失败' },
      { status: 500 }
    )
  }
} 