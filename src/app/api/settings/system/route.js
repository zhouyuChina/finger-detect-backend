import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// 获取系统配置
export async function GET() {
  try {
    // 查找系统配置（假设只有一条配置记录）
    const config = await prisma.systemSettings.findFirst()

    if (!config) {
      // 如果没有配置，返回默认值
      return NextResponse.json({
        success: true,
        data: {
          siteName: '',
          siteDescription: '',
          maxUploadSize: 10,
          sessionTimeout: 30
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('获取系统配置失败:', error)
    return NextResponse.json({
      success: false,
      message: '获取系统配置失败'
    }, { status: 500 })
  }
}

// 保存系统配置
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      siteName,
      siteDescription,
      maxUploadSize,
      sessionTimeout
    } = body

    // 查找是否已有配置
    const existingConfig = await prisma.systemSettings.findFirst()

    let config
    if (existingConfig) {
      // 更新现有配置
      config = await prisma.systemSettings.update({
        where: { id: existingConfig.id },
        data: {
          siteName,
          siteDescription,
          maxUploadSize: parseInt(maxUploadSize) || 10,
          sessionTimeout: parseInt(sessionTimeout) || 30
        }
      })
    } else {
      // 创建新配置
      config = await prisma.systemSettings.create({
        data: {
          siteName,
          siteDescription,
          maxUploadSize: parseInt(maxUploadSize) || 10,
          sessionTimeout: parseInt(sessionTimeout) || 30
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: '系统配置保存成功'
    })
  } catch (error) {
    console.error('保存系统配置失败:', error)
    return NextResponse.json({
      success: false,
      message: '保存系统配置失败'
    }, { status: 500 })
  }
}
