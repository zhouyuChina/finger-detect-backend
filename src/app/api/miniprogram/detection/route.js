import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取检测记录列表
async function getDetections(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const userId = searchParams.get('userId')

    // TODO: 从数据库获取检测记录
    // const detections = await prisma.detection.findMany({
    //   where: { userId: request.user.id },
    //   skip: (page - 1) * limit,
    //   take: limit,
    //   orderBy: { createdAt: 'desc' }
    // })

    // 模拟数据
    const mockDetections = [
      {
        id: 1,
        userId: request.user.id,
        archiveName: '档案1',
        detectionType: 'fingerprint',
        result: 'normal',
        confidence: 0.95,
        imageUrl: '/uploads/detection1.jpg',
        createdAt: new Date().toISOString()
      }
    ]

    return createSuccessResponse({
      list: mockDetections,
      pagination: {
        page,
        limit,
        total: 1,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('获取检测记录错误:', error)
    return createErrorResponse('获取检测记录失败')
  }
}

// 创建检测记录
async function createDetection(request) {
  try {
    const { archiveName, detectionType, imageUrl, result, confidence } = await request.json()

    if (!archiveName || !detectionType || !imageUrl) {
      return createErrorResponse('缺少必要参数', 400)
    }

    // TODO: 保存到数据库
    // const detection = await prisma.detection.create({
    //   data: {
    //     userId: request.user.id,
    //     archiveName,
    //     detectionType,
    //     imageUrl,
    //     result,
    //     confidence
    //   }
    // })

    const mockDetection = {
      id: Date.now(),
      userId: request.user.id,
      archiveName,
      detectionType,
      result,
      confidence,
      imageUrl,
      createdAt: new Date().toISOString()
    }

    return createSuccessResponse(mockDetection, '检测记录创建成功')

  } catch (error) {
    console.error('创建检测记录错误:', error)
    return createErrorResponse('创建检测记录失败')
  }
}

// 使用中间件包装处理函数
export const GET = miniprogramAuthMiddleware(getDetections)
export const POST = miniprogramAuthMiddleware(createDetection) 