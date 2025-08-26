import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 保存base64图片到服务器
async function saveBase64Image(base64Data, subUserId, detectionType) {
  try {
    const { writeFile, mkdir } = await import('node:fs/promises')
    const { join } = await import('node:path')
    
    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'photos')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('上传目录已存在')
    }
    
    // 生成文件名
    const timestamp = Date.now()
    const fileName = `photo_${subUserId}_${detectionType}_${timestamp}.jpg`
    const filePath = join(uploadDir, fileName)
    
    // 将base64转换为buffer并写入文件
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)
    
    // 生成可访问的URL
    const imageUrl = `/uploads/photos/${fileName}`
    
    console.log('✅ 图片保存成功:', imageUrl)
    return imageUrl
  } catch (error) {
    console.error('❌ 保存图片失败:', error)
    throw error
  }
}

// 创建图片记录（不进行AI检测）
async function createPhotoRecord(request) {
  let prisma = null
  try {
    console.log('📷 创建图片记录接口被调用')
    
    const body = await request.json()
    const { 
      subUserId,
      archiveId, 
      detectionType = 'left_hand_thumb',
      base64Image,
      remark = ''
    } = body

    // 验证必填字段
    if (!subUserId || !archiveId || !base64Image) {
      return createErrorResponse('子用户ID、档案ID和图片为必填项', 400)
    }

    // 验证检测类型
    const validTypes = [
      'left_hand_thumb', 'left_hand_index', 'left_hand_middle', 'left_hand_ring', 'left_hand_little',
      'right_hand_thumb', 'right_hand_index', 'right_hand_middle', 'right_hand_ring', 'right_hand_little',
      'left_foot_big', 'left_foot_second', 'left_foot_third', 'left_foot_fourth', 'left_foot_little',
      'right_foot_big', 'right_foot_second', 'right_foot_third', 'right_foot_fourth', 'right_foot_little'
    ]
    if (!validTypes.includes(detectionType)) {
      return createErrorResponse('检测类型无效', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 验证子用户权限
    const subUser = await prisma.subUser.findFirst({
      where: {
        id: subUserId,
        wechatUserId: request.user.id,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      return createErrorResponse('用户不存在或无权限操作', 404)
    }

    // 2. 验证档案权限
    const existingArchive = await prisma.archive.findFirst({
      where: {
        id: archiveId,
        subUserId: subUser.id
      }
    })

    if (!existingArchive) {
      return createErrorResponse('档案不存在或无权限访问', 404)
    }

    console.log('✅ 权限验证成功，档案:', existingArchive.archiveName)

    // 3. 处理base64图片
    let base64Img = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
    console.log('📷 处理图片，长度:', base64Img.length)

    // 4. 保存图片到服务器
    const savedImageUrl = await saveBase64Image(base64Img, subUserId, detectionType)

    // 5. 查询现有记录用于统计
    const allExistingRecords = await prisma.detection.findMany({
      where: {
        subUserId: subUser.id,
        archiveName: existingArchive.archiveName,
        status: 'completed'
      }
    })

    // 6. 更新档案统计信息
    const updatedArchive = await prisma.archive.update({
      where: { id: existingArchive.id },
      data: {
        photoCount: {
          increment: 1
        },
        detectionTime: new Date()
      }
    })

    // 7. 创建图片记录
    const photoRecord = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveId: updatedArchive.id,
        archiveName: updatedArchive.archiveName,
        detectionType: detectionType,
        imageUrl: savedImageUrl,
        result: 'photo_only',
        confidence: 0,
        status: 'completed',
        detectionTime: new Date(),
        remark: remark || `检测类型: ${detectionType}, 用户保存图片记录，未进行AI检测`,
        isFirstReport: false // 仅保存图片不算首次报告
      }
    })

    console.log('✅ 图片记录创建成功:', photoRecord.id)

    // 8. 构建响应数据
    const responseData = {
      record: {
        id: photoRecord.id,
        archiveName: photoRecord.archiveName,
        detectionType: photoRecord.detectionType,
        imageUrl: photoRecord.imageUrl,
        result: photoRecord.result,
        status: photoRecord.status,
        detectionTime: photoRecord.detectionTime,
        createdAt: photoRecord.createdAt
      },
      archive: {
        id: updatedArchive.id,
        archiveName: updatedArchive.archiveName,
        photoCount: updatedArchive.photoCount,
        detectionTime: updatedArchive.detectionTime
      },
      totalRecords: allExistingRecords.length + 1
    }

    return createSuccessResponse(responseData, '图片保存成功')

  } catch (error) {
    console.error('❌ 创建图片记录错误:', error.message)
    return createErrorResponse('保存图片记录失败')
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
export const POST = miniprogramAuthMiddleware(createPhotoRecord)