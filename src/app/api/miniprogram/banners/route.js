import { NextResponse as _NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取Banner列表（小程序专用）- 公开接口，无需认证
async function getBanners(request) {
  let prisma = null
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 5
    const position = searchParams.get('position')
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()
    
    // 从数据库获取活跃的Banner
    const where = {
      isActive: true,
      AND: [
        {
          OR: [
            { startTime: null },
            { startTime: { lte: new Date() } },
          ],
        },
        {
          OR: [
            { endTime: null },
            { endTime: { gte: new Date() } },
          ],
        },
      ],
    }

    // 可选：按位置筛选（top|middle|bottom）
    if (position && ['top', 'middle', 'bottom'].includes(position)) {
      where.position = position
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        position: true,
        sort: true,
        textColor: true,
      },
    })

    // 从数据库获取Banner配置
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['banner_interval', 'banner_autoplay']
        }
      }
    })
    
    const configObject = {}
    configs.forEach(config => {
      configObject[config.key] = config.value
    })

    // 默认配置
    const defaultConfig = {
      banner_interval: '3',
      banner_autoplay: 'true'
    }

    // 合并配置
    const finalConfig = { ...defaultConfig, ...configObject }

    return createSuccessResponse({
      banners: banners,
      config: {
        interval: parseInt(finalConfig.banner_interval) * 1000, // 转换为毫秒
        autoplay: finalConfig.banner_autoplay === 'true'
      }
    }, '获取Banner列表成功')

  } catch (error) {
    console.error('获取Banner列表错误:', error)
    return createErrorResponse('获取Banner列表失败')
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

// 直接导出处理函数，无需认证
export const GET = getBanners 