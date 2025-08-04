import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 获取单个子用户信息
async function getSubUser(request, context) {
  let prisma = null
  try {
    console.log('👤 获取子用户信息接口被调用')
    console.log('上下文:', context)
    console.log('用户:', request.user)
    
    const { params } = context || {}
    const { id: subUserId } = params || {}
    const userId = request.user?.id

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取子用户信息（确保属于当前微信用户）
    const subUser = await prisma.subUser.findFirst({
      where: { 
        id: subUserId,
        wechatUserId: userId,
        status: 'active'
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

    if (!subUser) {
      console.log('❌ 子用户不存在:', subUserId)
      return createErrorResponse('子用户不存在或无权限访问', 404)
    }

    console.log('✅ 获取子用户信息成功:', subUser.realName)

    // 处理手机号脱敏
    const processedSubUser = {
      ...subUser,
      phone: subUser.phone ? subUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }

    return createSuccessResponse(processedSubUser, '获取子用户信息成功')

  } catch (error) {
    console.error('❌ 获取子用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('获取子用户信息失败')
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

// 更新子用户信息
async function updateSubUser(request, context) {
  let prisma = null
  try {
    console.log('🔄 更新子用户信息接口被调用')
    
    // 从 URL 中提取子用户ID
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const subUserId = pathSegments[pathSegments.length - 1]
    const userId = request.user?.id
    
    if (!subUserId || !userId) {
      return createErrorResponse('缺少必要参数', 400)
    }
    
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

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 验证必填字段
    if (!username) {
      return createErrorResponse('用户名为必填项', 400)
    }

    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      return createErrorResponse('用户名长度应在2-20个字符之间', 400)
    }

    // 验证真实姓名长度（如果提供）
    if (realName && (realName.length < 2 || realName.length > 10)) {
      return createErrorResponse('真实姓名长度应在2-10个字符之间', 400)
    }



    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('邮箱格式不正确', 400)
    }

    // 验证年龄范围
    if (age && (age < 1 || age > 120)) {
      return createErrorResponse('年龄应在1-120岁之间', 400)
    }

    // 检查子用户是否存在且属于当前微信用户
    const existingSubUser = await prisma.subUser.findFirst({
      where: { 
        id: subUserId,
        wechatUserId: userId,
        status: 'active'
      }
    })

    if (!existingSubUser) {
      return createErrorResponse('子用户不存在或无权限访问', 404)
    }

    // 如果修改用户名，检查是否与其他子用户冲突（在同一微信用户下）
    if (username && username !== existingSubUser.username) {
      const duplicateSubUser = await prisma.subUser.findFirst({
        where: { 
          wechatUserId: userId,
          username: username,
          id: { not: subUserId }
        }
      })

      if (duplicateSubUser) {
        return createErrorResponse('用户名已存在', 400)
      }
    }

    // 更新子用户信息
    const updatedSubUser = await prisma.subUser.update({
      where: { id: subUserId },
      data: {
        username,
        ...(realName && { realName }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(age && { age: parseInt(age) }),
        ...(gender && { gender: gender.toString() }),
        ...(address && { address }),
        ...(remark && { remark }),
        updatedAt: new Date()
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

    console.log('✅ 子用户信息更新成功:', updatedSubUser.realName)

    // 处理手机号脱敏
    const processedSubUser = {
      ...updatedSubUser,
      phone: updatedSubUser.phone ? updatedSubUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
    }

    return createSuccessResponse(processedSubUser, '子用户信息更新成功')

  } catch (error) {
    console.error('❌ 更新子用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('更新子用户信息失败')
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
export const GET = miniprogramAuthMiddleware(getSubUser)
export const PUT = miniprogramAuthMiddleware(updateSubUser) 