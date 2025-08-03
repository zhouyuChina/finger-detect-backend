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

    // 获取当前子用户ID
    const currentSubUserId = request.user.currentSubUser?.id

    // 更新微信用户信息（基本信息）
    const updatedWechatUser = await prisma.wechatUser.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar && { avatar }),
        ...(gender && { gender: gender.toString() }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        updatedAt: true
      }
    })

    // 如果有子用户，同时更新子用户信息（详细个人信息）
    let updatedSubUser = null
    if (currentSubUserId) {
      updatedSubUser = await prisma.subUser.update({
        where: { id: currentSubUserId },
        data: {
          ...(phone && { phone }),
          ...(email && { email }),
          ...(gender && { gender: gender.toString() }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          phone: true,
          email: true,
          gender: true,
          updatedAt: true
        }
      })
    }

    console.log('✅ 用户信息更新成功:', updatedWechatUser.nickname)

    return createSuccessResponse({
      id: updatedWechatUser.id,
      nickname: updatedWechatUser.nickname,
      avatar: updatedWechatUser.avatar,
      avatarUrl: updatedWechatUser.avatar,
      gender: updatedSubUser?.gender || updatedWechatUser.gender,
      phone: updatedSubUser?.phone,
      email: updatedSubUser?.email,
      updatedAt: updatedWechatUser.updatedAt
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