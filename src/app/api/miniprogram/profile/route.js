import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取用户基本信息
async function getUserProfile(request) {
  let prisma = null
  try {
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()
    console.log('🔍 Profile 接口被调用')
    console.log('📋 request.user:', request.user)
    console.log('📋 用户ID:', request.user?.id)
    console.log('📋 用户类型:', typeof request.user?.id)
    
    // 获取微信用户信息
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        openid: true,
        nickname: true,
        avatar: true,
        gender: true,
        city: true,
        province: true,
        country: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!wechatUser) {
      console.log('❌ 微信用户不存在，用户ID:', request.user.id)
      return createErrorResponse('用户不存在', 200)
    }

    console.log('✅ 微信用户信息查询成功:', wechatUser.id)

    // 获取当前子用户信息（如果有的话）
    let currentSubUser = null
    if (request.user.currentSubUser) {
      currentSubUser = await prisma.subUser.findUnique({
        where: { id: request.user.currentSubUser.id },
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          age: true,
          gender: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      })
    }

    // 处理手机号脱敏
    const maskedPhone = currentSubUser?.phone ? currentSubUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null

    // 构建响应数据，优先使用子用户信息，回退到微信用户信息
    const userData = {
      id: wechatUser.id,
      openid: wechatUser.openid,
      name: currentSubUser?.realName || wechatUser.nickname || '微信用户', // 优先显示真实姓名
      nickname: wechatUser.nickname,
      username: currentSubUser?.username,
      phone: maskedPhone,
      avatar: wechatUser.avatar,
      avatarUrl: wechatUser.avatar, // 兼容字段
      email: currentSubUser?.email,
      gender: currentSubUser?.gender || wechatUser.gender,
      age: currentSubUser?.age,
      address: currentSubUser?.address,
      birthday: null, // 当前数据库没有生日字段
      createdAt: wechatUser.createdAt,
      updatedAt: wechatUser.updatedAt,
      // 子用户信息
      subUsers: request.user.subUsers || [],
      currentSubUser: currentSubUser
    }

    return createSuccessResponse(userData, '获取用户信息成功')

  } catch (error) {
    console.error('❌ 获取用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取用户信息失败')
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
export const GET = miniprogramAuthMiddleware(getUserProfile) 