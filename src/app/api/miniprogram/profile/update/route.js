import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 更新用户信息
async function updateUserProfile(request) {
  let prisma = null
  try {
    console.log('🔄 更新用户信息接口被调用')
    
    const userId = request.user.id
    const body = await request.json()
    const { nickname, avatar, gender, phone, email } = body

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 验证昵称长度
    if (nickname && (nickname.length < 1 || nickname.length > 20)) {
      return createErrorResponse('昵称长度应在1-20个字符之间', 400)
    }

    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return createErrorResponse('手机号格式不正确', 400)
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('邮箱格式不正确', 400)
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar && { avatar }),
        ...(gender && { gender: gender.toString() }),
        ...(phone && { phone }),
        ...(email && { email }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        phone: true,
        email: true,
        updatedAt: true
      }
    })

    console.log('✅ 用户信息更新成功:', updatedUser.nickname)

    return createSuccessResponse({
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      avatarUrl: updatedUser.avatar,
      gender: updatedUser.gender,
      phone: updatedUser.phone,
      email: updatedUser.email,
      updatedAt: updatedUser.updatedAt
    }, '用户信息更新成功')

  } catch (error) {
    console.error('❌ 更新用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('更新用户信息失败')
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

// 使用微信小程序认证中间件
export const PUT = miniprogramAuthMiddleware(updateUserProfile) 