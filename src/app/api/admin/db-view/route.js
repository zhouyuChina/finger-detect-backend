import { NextResponse } from 'next/server'

// 查看数据库内容（仅用于开发调试）
async function viewDatabase(request) {
  let prisma = null
  try {
    console.log('🔍 数据库查看接口被调用')
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取用户数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        openid: true,
        avatar: true,
        gender: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // 只显示最近20个用户
    })

    // 获取统计数据
    const totalUsers = await prisma.user.count()
    const todayUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '数据库查看成功',
      data: {
        totalUsers,
        todayUsers,
        users,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 数据库查看错误:', error.message)
    return NextResponse.json({
      success: false,
      message: error.message,
      error: error.stack
    }, { status: 500 })
  } finally {
    // 确保 Prisma 连接被正确关闭
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

// 使用 GET 方法
export const GET = viewDatabase 