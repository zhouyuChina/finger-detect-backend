import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

// 文件上传接口
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 生成文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${extension}`

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        fileName: fileName,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    )
  }
} 