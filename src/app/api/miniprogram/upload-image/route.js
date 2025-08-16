import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'
import config from '../../../../lib/config.js'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

// 上传图片
async function uploadImage(request) {
  try {
    console.log('📤 图片上传接口被调用')
    
    const body = await request.json()
    const { 
      base64Image,
      fileName = `image_${Date.now()}.jpg`,
      subUserId
    } = body

    if (!base64Image) {
      return createErrorResponse('base64图片为必填项', 400)
    }

    // 移除data:image/jpeg;base64,前缀（如果存在）
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // 验证base64格式
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
      return createErrorResponse('base64格式无效', 400)
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('上传目录已存在')
    }

    // 生成文件路径
    const filePath = join(uploadDir, fileName)
    
    // 将base64转换为buffer并写入文件
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)
    
    // 生成可访问的URL
    const imageUrl = `/uploads/${fileName}`
    const fullUrl = config.getImageUrl(imageUrl)
    
    console.log('✅ 图片上传成功:', fullUrl)
    
    return createSuccessResponse({
      imageUrl: imageUrl,
      fullUrl: fullUrl,
      fileName: fileName,
      fileSize: buffer.length
    }, '图片上传成功')

  } catch (error) {
    console.error('❌ 图片上传失败:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('图片上传失败')
  }
}

// 使用微信小程序认证中间件
export const POST = miniprogramAuthMiddleware(uploadImage)
