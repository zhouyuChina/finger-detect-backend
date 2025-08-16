import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

// 获取图片
async function getImage(request) {
  try {
    console.log('🖼️ 图片获取接口被调用')
    
    const { searchParams } = new URL(request.url)
    const imagePath = searchParams.get('path')
    
    if (!imagePath) {
      return createErrorResponse('图片路径参数缺失', 400)
    }
    
    // 安全检查：只允许访问uploads目录下的图片
    if (!imagePath.startsWith('/uploads/')) {
      return createErrorResponse('无效的图片路径', 403)
    }
    
    // 构建完整的文件路径
    const fullPath = join(process.cwd(), 'public', imagePath)
    
    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      return createErrorResponse('图片文件不存在', 404)
    }
    
    // 读取图片文件
    const imageBuffer = await readFile(fullPath)
    
    // 根据文件扩展名确定Content-Type
    let contentType = 'image/jpeg' // 默认
    if (imagePath.endsWith('.png')) {
      contentType = 'image/png'
    } else if (imagePath.endsWith('.gif')) {
      contentType = 'image/gif'
    } else if (imagePath.endsWith('.webp')) {
      contentType = 'image/webp'
    }
    
    console.log('✅ 图片获取成功:', imagePath)
    
    // 返回图片
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 缓存1年
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('❌ 图片获取失败:', error.message)
    return createErrorResponse('图片获取失败')
  }
}

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getImage)
