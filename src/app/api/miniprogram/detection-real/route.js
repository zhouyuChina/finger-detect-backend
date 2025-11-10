import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'
import config from '../../../../lib/config.js'

// 调用真实的第三方检测服务
async function callRealDetectionService(base64Img) {
  console.log('🤖 调用真实第三方检测服务')

  try {
    // 创建600秒超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.log('⏰ 第三方检测服务请求超时（600秒）')
    }, 900000) // 600秒 = 600000毫秒

    const response = await fetch(config.detectionService.fullUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64_img: base64Img
      }),
      signal: controller.signal // 添加超时信号
    })

    // 清除超时定时器
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ 第三方检测服务返回结果:', result)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('❌ 调用第三方检测服务失败:', error)

    // 检查是否为超时错误
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: '第三方检测服务请求超时（600秒），请稍后重试'
      }
    }

    return {
      success: false,
      error: error.message
    }
  }
}

// 将图片URL转换为base64
async function convertImageToBase64(imageUrl) {
  try {
    // 检查是否是微信小程序临时文件
    if (imageUrl.startsWith('wxfile://') || imageUrl.startsWith('http://tmp/')) {
      throw new Error('微信小程序临时文件无法从服务器访问，请使用base64Image参数')
    }
    
    // 使用配置文件获取完整的图片URL
    const fullUrl = config.getImageUrl(imageUrl)
    
    console.log('🔄 开始转换图片为base64:', fullUrl)
    
    const response = await fetch(fullUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    
    console.log('✅ 图片转换为base64成功，长度:', base64.length)
    return base64
  } catch (error) {
    console.error('❌ 图片转换base64失败:', error)
    throw error
  }
}

// 保存base64图片到服务器
async function saveBase64Image(base64Data, subUserId, detectionType) {
  try {
    const { writeFile, mkdir } = await import('node:fs/promises')
    const { join } = await import('node:path')
    
    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'detections')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('上传目录已存在')
    }
    
    // 生成文件名
    const timestamp = Date.now()
    const fileName = `detection_${subUserId}_${detectionType}_${timestamp}.jpg`
    const filePath = join(uploadDir, fileName)
    
    // 将base64转换为buffer并写入文件
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)
    
    // 生成可访问的URL
    const imageUrl = `/uploads/detections/${fileName}`
    
    console.log('✅ base64图片保存成功:', imageUrl)
    return imageUrl
  } catch (error) {
    console.error('❌ 保存base64图片失败:', error)
    throw error
  }
}

// 创建真实检测记录
async function createRealDetection(request) {
  let prisma = null
  try {
    console.log('➕ 创建真实检测记录接口被调用')
    
    const body = await request.json()
    const { 
      subUserId,
      archiveId, 
      detectionType = 'left_hand_thumb',
      imageUrl,      // 方式1：图片URL
      base64Image,   // 方式2：直接base64图片
      performDetection = true  // 新增：是否进行AI检测，默认为true
    } = body
    console.log(`📊 用户选择: ${performDetection ? '进行AI检测' : '仅保存图片'}`)

    // 验证必填字段
    if (!subUserId || !archiveId) {
      return createErrorResponse('子用户ID和档案ID为必填项', 400)
    }
    
    if (!imageUrl && !base64Image) {
      return createErrorResponse('图片URL或base64图片为必填项', 400)
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

    // 1. 验证子用户是否属于当前微信用户
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
      console.log('❌ 子用户不存在或无权限，微信用户ID:', request.user.id, '子用户ID:', subUserId)
      return createErrorResponse('用户不存在或无权限操作', 404)
    }

    console.log('✅ 验证子用户权限成功:', subUser.realName)

    // 2. 检查档案是否已存在
    const existingArchive = await prisma.archive.findFirst({
      where: {
        id: archiveId,
        subUserId: subUser.id
      }
    })

    if (!existingArchive) {
      console.log('❌ 档案不存在或无权限访问:', archiveId)
      return createErrorResponse('档案不存在或无权限访问', 404)
    }

    console.log('✅ 找到档案:', existingArchive.archiveName)

    // 3. 获取base64图片
    let base64Img
    let savedImageUrl = imageUrl // 默认使用原始URL
    
    if (base64Image) {
      console.log('🔄 使用直接传递的base64图片...')
      // 移除data:image/jpeg;base64,前缀（如果存在）
      base64Img = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
      console.log('✅ base64图片处理完成，长度:', base64Img.length)
    } else {
      console.log('🔄 开始转换图片URL为base64...')
      base64Img = await convertImageToBase64(imageUrl)
      console.log('✅ 图片转换完成')
    }

    // 4. 检查是否已有检测记录（用于统计信息，使用 archiveId）
    const allExistingDetections = await prisma.detection.findMany({
      where: {
        archiveId: archiveId,
        status: 'completed'
      },
      select: {
        id: true,
        result: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    // 检查是否已有异常检测记录（灰指甲，使用 archiveId）
    const existingAbnormalDetections = await prisma.detection.findMany({
      where: {
        archiveId: archiveId,
        status: 'completed',
        result: 'onychomycosis'  // 只查找异常（灰指甲）记录
      },
      select: {
        id: true
      }
    })
    
    console.log(`📊 档案检测记录统计:`)
    console.log(`- 总检测记录数: ${allExistingDetections.length}`)
    console.log(`- 异常记录数: ${existingAbnormalDetections.length}`)
    console.log(`- 用户选择: ${performDetection ? 'AI检测' : '仅保存图片'}`)
    
    // 5. 处理检测逻辑
    let detectionResult = null
    let finalResult = null
    let shouldSaveToDatabase = true // 总是保存到数据库
    
    if (performDetection) {
      // 用户选择进行AI检测
      console.log('🔄 用户选择AI检测，开始调用第三方检测服务...')
      console.log('检测服务URL:', config.detectionService.fullUrl())
      console.log('base64图片长度:', base64Img.length)
      
      const thirdPartyResult = await callRealDetectionService(base64Img)
      
      if (!thirdPartyResult.success) {
        console.error('❌ 第三方检测服务调用失败:', thirdPartyResult.error)
        return createErrorResponse(`第三方检测服务调用失败: ${thirdPartyResult.error}`, 500)
      }

      console.log('✅ 第三方检测服务调用成功')

      // 处理检测结果
      detectionResult = thirdPartyResult.data
      finalResult = detectionResult.final_result
      
      console.log('📊 检测结果:', finalResult)
      console.log('📊 模型结果:', detectionResult.model_results)
    } else {
      // 用户选择仅保存图片
      console.log('📸 用户选择仅保存图片，不进行AI检测')
      finalResult = 'photo_only' // 标记为仅拍照
    }
    
    let newDetection = null
    let archive = null

    // 总是保存到数据库（AI检测结果或仅拍照记录）
    // 如果是base64图片，需要保存到服务器
    if (base64Image) {
      console.log('💾 保存base64图片到服务器...')
      savedImageUrl = await saveBase64Image(base64Img, subUserId, detectionType)
      console.log('✅ 图片保存成功:', savedImageUrl)
    }
    
    if (performDetection) {
      console.log('💾 AI检测完成，保存检测结果到数据库')
    } else {
      console.log('💾 用户选择仅保存图片')
    }

    console.log(`📊 当前档案异常记录数: ${existingAbnormalDetections.length}`)
    console.log(`📊 当前档案总记录数: ${allExistingDetections.length}`)

    if (allExistingDetections.length > 0) {
      // 更新档案信息（已有检测记录）
      archive = await prisma.archive.update({
        where: { id: existingArchive.id },
        data: {
          photoCount: {
            increment: 1
          },
          detectionTime: new Date()
        }
      })
    } else {
      // 创建第一个检测记录
      archive = await prisma.archive.update({
        where: { id: existingArchive.id },
        data: {
          photoCount: 1, // 创建第一个检测记录，照片数量为1
          detectionTime: new Date()
        }
      })
    }

    // 创建检测记录（使用 archiveId）
    const detectionData = {
      archiveId: archive.id,
      archiveName: archive.archiveName, // 兼容旧 schema，后端自行写入
      subUserId: subUserId,
      detectionType: detectionType,
      imageUrl: savedImageUrl, // 使用保存后的图片URL
      result: finalResult,
      status: 'completed',
      detectionTime: new Date(),
      // 判断是否为首次异常报告：只有AI检测出异常且之前没有异常记录时才为true
      isFirstReport: performDetection && finalResult === 'onychomycosis' && existingAbnormalDetections.length === 0
    }
    
    if (performDetection) {
      // AI检测的情况
      detectionData.confidence = parseFloat(detectionResult.model_results?.fusion?.confidence?.replace('%', '') || '0') / 100
      detectionData.remark = `检测类型: ${detectionType}, AI检测结果: ${finalResult}, 融合模型置信度: ${detectionResult.model_results?.fusion?.confidence || 'N/A'}`
    } else {
      // 仅拍照的情况
      detectionData.confidence = 0
      detectionData.remark = `检测类型: ${detectionType}, 用户选择仅保存图片，未进行AI检测`
    }
    
    newDetection = await prisma.detection.create({
      data: detectionData
    })

    console.log('✅ 检测记录创建成功:', newDetection.archiveName)

    // 7. 构建响应数据
    const responseData = {
      detection: {
        id: newDetection.id,
        archiveName: newDetection.archiveName,
        detectionType: newDetection.detectionType,
        imageUrl: newDetection.imageUrl,
        result: newDetection.result,
        confidence: newDetection.confidence,
        status: newDetection.status,
        remark: newDetection.remark,
        detectionTime: newDetection.detectionTime,
        createdAt: newDetection.createdAt
      },
      thirdPartyResult: performDetection ? {
        final_result: finalResult,
        model_results: detectionResult.model_results,
        imageUrl: savedImageUrl,
        detectionType: detectionType,
        timestamp: new Date().toISOString()
      } : {
        final_result: 'photo_only',
        model_results: null,
        imageUrl: savedImageUrl,
        detectionType: detectionType,
        timestamp: new Date().toISOString(),
        message: '用户选择仅保存图片，未进行AI检测'
      },
      archive: {
        id: archive.id,
        archiveName: archive.archiveName,
        photoCount: archive.photoCount,
        detectionTime: archive.detectionTime,
        createdAt: archive.createdAt
      },
      isFirstReport: newDetection.isFirstReport,
      performedDetection: performDetection
    }

    const message = performDetection ? 
      (finalResult === 'onychomycosis' ? 'AI检测完成，发现异常，报告已生成' : 'AI检测完成，结果正常') : 
      '图片保存完成'
    return createSuccessResponse(responseData, message)

  } catch (error) {
    console.error('❌ 创建真实检测记录错误:', error.message)
    console.error('错误堆栈:', error.stack)
    
    // 提供更详细的错误信息
    let errorMessage = '创建检测记录失败'
    if (error.message.includes('第三方检测服务')) {
      errorMessage = `第三方检测服务调用失败: ${error.message}`
    } else if (error.message.includes('base64')) {
      errorMessage = `图片处理失败: ${error.message}`
    } else if (error.message.includes('数据库')) {
      errorMessage = `数据库操作失败: ${error.message}`
    }
    
    return createErrorResponse(errorMessage)
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
export const POST = miniprogramAuthMiddleware(createRealDetection)
