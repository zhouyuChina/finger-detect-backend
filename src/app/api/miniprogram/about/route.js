import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../src/lib/miniprogramAuth.js'

const prisma = new PrismaClient()

// 获取关于我们信息
async function getAboutInfo(request) {
  try {
    // 获取企业信息
    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    // 如果没有企业信息，返回默认信息
    if (!company) {
      return createSuccessResponse({
        name: '指纹检测系统',
        logo: null,
        description: '专业的指纹检测服务提供商',
        address: null,
        phone: null,
        email: null,
        website: null,
        wechat: null,
        version: '1.0.0',
        copyright: '© 2024 指纹检测系统. All rights reserved.'
      }, '获取关于我们信息成功')
    }

    // 返回企业信息
    return createSuccessResponse({
      name: company.name,
      logo: company.logo,
      description: company.description,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      wechat: company.wechat,
      version: '1.0.0',
      copyright: `© ${new Date().getFullYear()} ${company.name}. All rights reserved.`
    }, '获取关于我们信息成功')

  } catch (error) {
    console.error('获取关于我们信息失败:', error)
    return createErrorResponse('获取关于我们信息失败', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// 导出处理函数，使用认证中间件包装
export const GET = miniprogramAuthMiddleware(getAboutInfo) 