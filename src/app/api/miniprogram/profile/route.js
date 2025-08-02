import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma/index.js'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

const prisma = new PrismaClient()

// 获取用户基本信息
async function getUserProfile(request) {
  try {
    console.log('🔍 Profile 接口被调用')
    console.log('📋 request.user:', request.user)
    console.log('📋 用户ID:', request.user?.id)
    console.log('📋 用户类型:', typeof request.user?.id)
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        realName: true,
        nickname: true,
        username: true,
        phone: true,
        avatar: true,
        email: true,
        gender: true,
        age: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      console.log('❌ 用户不存在，用户ID:', request.user.id)
      return createErrorResponse('用户不存在', 404)
    }

    console.log('✅ 用户信息查询成功:', user.id)

    // 处理手机号脱敏
    const maskedPhone = user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null

    // 构建响应数据，支持多种字段名称
    const userData = {
      id: user.id,
      name: user.realName || user.nickname || user.username, // 优先显示真实姓名
      nickname: user.nickname,
      username: user.username,
      phone: maskedPhone,
      avatar: user.avatar,
      avatarUrl: user.avatar, // 兼容字段
      email: user.email,
      gender: user.gender,
      birthday: null, // 当前数据库没有生日字段
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return createSuccessResponse(userData, '获取用户信息成功')

  } catch (error) {
    console.error('❌ 获取用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取用户信息失败')
  } finally {
    await prisma.$disconnect()
  }
}

// 使用微信小程序认证中间件
export const GET = miniprogramAuthMiddleware(getUserProfile) 