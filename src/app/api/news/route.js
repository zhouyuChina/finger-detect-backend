import { NextResponse } from 'next/server'
import { prisma, createPagination, createPaginatedResponse, handleDatabaseError } from '../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../lib/middleware.js'

// 获取新闻列表（公开接口，无需认证）
export async function GET(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const isPublished = searchParams.get('isPublished')
    const search = searchParams.get('search') || ''
    
    const { skip, take } = createPagination(page, limit)
    
    // 构建查询条件
    const where = {}
    
    if (isPublished !== null && isPublished !== undefined) {
      where.isPublished = isPublished === 'true'
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // 查询新闻
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take,
        orderBy: [
          { isPublished: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.news.count({ where })
    ])
    
    const response = createPaginatedResponse(news, total, page, limit)
    return wrapResponse(response, '获取新闻列表成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 创建新闻
export async function POST(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) return authResult
    
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
      status = 'draft',
      readCount = 0,
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
    
    // 创建新闻
    const news = await prisma.news.create({
      data: {
        title,
        content: content || '',
        summary: summary || '',
        coverImage: coverImage || '',
        author: author || '系统',
        category: category || '默认分类',
        tags: tags || [],
        types,
        status,
        viewCount: 0,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null
      }
    })
    
    return wrapResponse(news, '资讯创建成功', 201)
    
  } catch (error) {
    console.error('创建新闻错误:', error)
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 