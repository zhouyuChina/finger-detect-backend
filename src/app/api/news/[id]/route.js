import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'

// 获取单个资讯
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // 应用限流中间件
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const news = await prisma.news.findUnique({
      where: { id: id }
    })

    if (!news) {
      return NextResponse.json({
        success: false,
        message: '资讯不存在'
      }, { status: 404 })
    }

    return wrapResponse(news, '获取资讯成功')
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 更新资讯
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    
    // 应用限流和管理员认证中间件
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const { 
      title, 
      content, 
      summary, 
      coverImage, 
      author, 
      isPublished,
      category,
      tags,
      status,
      isTop = false,
      isImportant = false,
      isSystem = false,
      isNotification = false
    } = body

    // 验证必填字段
    if (!title) {
      return NextResponse.json({
        success: false,
        message: '标题是必填字段'
      }, { status: 400 })
    }

    // 构建类型数组
    const types = []
    if (isTop) types.push('置顶')
    if (isImportant) types.push('重要')
    if (isSystem) types.push('系统')
    if (isNotification) types.push('通知')

    // 检查资讯是否存在
    const existingNews = await prisma.news.findUnique({
      where: { id: id }
    })

    if (!existingNews) {
      return NextResponse.json({
        success: false,
        message: '资讯不存在'
      }, { status: 404 })
    }

    // 更新资讯
    const updatedNews = await prisma.news.update({
      where: { id: id },
      data: {
        title,
        content: content || '',
        summary: summary || '',
        coverImage: coverImage || '',
        author: author || '系统',
        category: category || '默认分类',
        tags: tags || [],
        types,
        status: status || 'draft',
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null
      }
    })

    return wrapResponse(updatedNews, '资讯更新成功')
  } catch (error) {
    console.error('更新资讯错误:', error)
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 删除资讯
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    // 应用限流和管理员认证中间件
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    // 检查资讯是否存在
    const existingNews = await prisma.news.findUnique({
      where: { id: id }
    })

    if (!existingNews) {
      return NextResponse.json({
        success: false,
        message: '资讯不存在'
      }, { status: 404 })
    }

    // 删除资讯
    await prisma.news.delete({
      where: { id: id }
    })

    return wrapResponse(null, '资讯删除成功')
  } catch (error) {
    console.error('删除资讯错误:', error)
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 