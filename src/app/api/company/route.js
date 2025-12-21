import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'
import { rateLimitMiddleware, adminAuthMiddleware } from '../../../../src/lib/middleware.js'

const prisma = new PrismaClient()

// 获取企业信息（公开接口，无需认证）
export async function GET(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request, 100, 60)
    if (rateLimitResult) return rateLimitResult

    // 获取企业信息（通常只有一条记录）
    const company = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: company
    })
  } catch (error) {
    console.error('获取企业信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    )
  }
}

// 创建或更新企业信息
export async function POST(request) {
  try {
    // 速率限制
    const rateLimitResult = await rateLimitMiddleware(request)
    if (rateLimitResult) return rateLimitResult

    // 管理员认证
    const authResult = await adminAuthMiddleware(request)
    if (authResult && authResult.error) return authResult

    const body = await request.json()
    const {
      name,
      logo,
      description,
      address,
      phone,
      email,
      website,
      wechat
    } = body

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, message: '公司名称是必填字段' },
        { status: 400 }
      )
    }

    // 检查是否已存在企业信息
    const existingCompany = await prisma.company.findFirst()

    let company
    if (existingCompany) {
      // 更新现有企业信息
      company = await prisma.company.update({
        where: { id: existingCompany.id },
        data: {
          name,
          logo,
          description,
          address,
          phone,
          email,
          website,
          wechat
        }
      })
    } else {
      // 创建新的企业信息
      company = await prisma.company.create({
        data: {
          name,
          logo,
          description,
          address,
          phone,
          email,
          website,
          wechat
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: existingCompany ? '企业信息更新成功' : '企业信息创建成功',
      data: company
    })
  } catch (error) {
    console.error('保存企业信息失败:', error)
    return NextResponse.json(
      { success: false, message: '保存失败' },
      { status: 500 }
    )
  }
} 