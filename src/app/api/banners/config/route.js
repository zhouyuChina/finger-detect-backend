import { NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '../../../../lib/db.js'
import { rateLimitMiddleware, adminAuthMiddleware, wrapResponse } from '../../../../lib/middleware.js'

// 获取Banner配置
export async function GET(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) return NextResponse.json(authResult, { status: 401 })
    
    // 从系统配置表获取Banner配置
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['banner_limit', 'banner_interval', 'banner_autoplay']
        }
      }
    })
    
    // 转换为对象格式
    const configObject = {}
    configs.forEach(config => {
      configObject[config.key] = config.value
    })
    
    // 默认值
    const defaultConfig = {
      banner_limit: '5',
      banner_interval: '3',
      banner_autoplay: 'true'
    }
    
    const result = { ...defaultConfig, ...configObject }
    
    return wrapResponse(result, '获取Banner配置成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
}

// 更新Banner配置
export async function PUT(request) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request, 50, 60)
    if (rateLimitResult) return rateLimitResult
    
    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) return NextResponse.json(authResult, { status: 401 })
    
    const body = await request.json()
    const { banner_limit, banner_interval, banner_autoplay } = body
    
    // 验证数据
    const limit = parseInt(banner_limit)
    const interval = parseInt(banner_interval)
    
    if (limit < 1 || limit > 10) {
      return NextResponse.json({
        success: false,
        message: 'Banner数量限制必须在1-10之间'
      }, { status: 400 })
    }
    
    if (interval < 1 || interval > 10) {
      return NextResponse.json({
        success: false,
        message: '滚动间隔时间必须在1-10秒之间'
      }, { status: 400 })
    }
    
    // 更新配置
    const configs = [
      { key: 'banner_limit', value: banner_limit.toString() },
      { key: 'banner_interval', value: banner_interval.toString() },
      { key: 'banner_autoplay', value: banner_autoplay.toString() }
    ]
    
    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: config
      })
    }
    
    return wrapResponse(null, 'Banner配置更新成功')
    
  } catch (error) {
    const errorResult = handleDatabaseError(error)
    return NextResponse.json(errorResult, { status: 500 })
  }
} 