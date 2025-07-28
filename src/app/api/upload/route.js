import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

// 文件上传处理
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: '没有找到上传的文件'
      }, { status: 400 })
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: '不支持的文件类型，只支持 JPEG、PNG、GIF、WebP 格式'
      }, { status: 400 })
    }
    
    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: '文件大小不能超过 5MB'
      }, { status: 400 })
    }
    
    // 生成文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${extension}`
    
    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    // 保存文件
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`
    
    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      data: {
        url: fileUrl,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    })
    
  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json({
      success: false,
      message: '文件上传失败',
      error: error.message
    }, { status: 500 })
  }
} 