import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 获取当前微信用户下的所有子用户信息
async function getCurrentUserSubUsers(request) {
  let prisma = null
  try {
    console.log('👥 获取子用户列表接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取当前微信用户信息
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
        status: true,
        lastLogin: true,
        registerTime: true
      }
    })

    if (!wechatUser) {
      console.log('❌ 微信用户不存在，用户ID:', request.user.id)
      return createErrorResponse('用户不存在', 404)
    }

    // 获取该微信用户下的所有子用户
    const subUsers = await prisma.subUser.findMany({
      where: { 
        wechatUserId: request.user.id,
        status: 'active' // 只获取活跃状态的子用户
      },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        age: true,
        gender: true,
        address: true,
        status: true,
        archives: true,
        photos: true,
        reports: true,
        remark: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log('✅ 获取子用户列表成功，数量:', subUsers.length)

    // 处理手机号脱敏
    const processedSubUsers = subUsers.map(user => ({
      ...user,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }))

    // 构建响应数据
    const responseData = {
      wechatUser: {
        id: wechatUser.id,
        openid: wechatUser.openid,
        nickname: wechatUser.nickname,
        avatar: wechatUser.avatar,
        avatarUrl: wechatUser.avatar, // 兼容字段
        gender: wechatUser.gender,
        city: wechatUser.city,
        province: wechatUser.province,
        country: wechatUser.country,
        status: wechatUser.status,
        lastLogin: wechatUser.lastLogin,
        registerTime: wechatUser.registerTime
      },
      subUsers: processedSubUsers,
      totalCount: subUsers.length,
      currentSubUser: request.user.currentSubUser ? {
        id: request.user.currentSubUser.id,
        username: request.user.currentSubUser.username,
        realName: request.user.currentSubUser.realName
      } : null
    }

    return createSuccessResponse(responseData, '获取子用户列表成功')

  } catch (error) {
    console.error('❌ 获取子用户列表错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取子用户列表失败')
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

// 创建新的子用户
async function createSubUser(request) {
  let prisma = null
  try {
    console.log('➕ 创建子用户接口被调用')
    
    const body = await request.json()
    const { 
      username, 
      realName, 
      phone, 
      email, 
      age, 
      gender, 
      address, 
      remark 
    } = body

    // 验证必填字段
    if (!username || !realName) {
      return createErrorResponse('用户名和真实姓名为必填项', 400)
    }

    // 验证用户名长度
    if (username.length < 1 || username.length > 20) {
      return createErrorResponse('用户名长度应在1-20个字符之间', 400)
    }

    // 验证真实姓名长度
    if (realName.length < 1 || realName.length > 10) {
      return createErrorResponse('真实姓名长度应在2-10个字符之间', 400)
    }

    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return createErrorResponse('手机号格式不正确', 400)
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('邮箱格式不正确', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 检查当前微信用户的子用户数量
    const currentSubUserCount = await prisma.subUser.count({
      where: { 
        wechatUserId: request.user.id
      }
    })

    // 限制每个微信号最多50个用户账号（包括自己的默认账号）
    if (currentSubUserCount >= 50) {
      return createErrorResponse('已达到最大用户数量限制（50个），无法创建更多用户账号', 400)
    }

    // 检查用户名是否已存在（在同一微信用户下）
    const existingSubUser = await prisma.subUser.findFirst({
      where: { 
        wechatUserId: request.user.id,
        username: username 
      }
    })

    if (existingSubUser) {
      return createErrorResponse('用户名已存在', 400)
    }

    // 创建子用户
    const newSubUser = await prisma.subUser.create({
      data: {
        wechatUserId: request.user.id,
        username,
        realName,
        phone,
        email,
        age: age ? parseInt(age) : null,
        gender: gender?.toString(),
        address,
        status: 'active',
        remark,
        archives: 0,
        photos: 0,
        reports: 0
      },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        age: true,
        gender: true,
        address: true,
        status: true,
        remark: true,
        archives: true,
        photos: true,
        reports: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ 子用户创建成功:', newSubUser.realName)

    // 处理手机号脱敏
    const processedSubUser = {
      ...newSubUser,
      phone: newSubUser.phone ? newSubUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }

    return createSuccessResponse(processedSubUser, '子用户创建成功')

  } catch (error) {
    console.error('❌ 创建子用户错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('创建子用户失败')
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
export const GET = miniprogramAuthMiddleware(getCurrentUserSubUsers)
export const POST = miniprogramAuthMiddleware(createSubUser) 