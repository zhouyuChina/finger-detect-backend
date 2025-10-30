import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 更新用户信息
async function updateUserProfile(request) {
  let prisma = null
  try {
    console.log('🔄 更新用户信息接口被调用')
    
    const userId = request.user.id
    const body = await request.json()
    const { nickname, avatar, gender, phone, email, age, address } = body
    
    console.log('📋 请求数据:', JSON.stringify(body, null, 2))
    console.log('📋 用户ID:', userId)
    console.log('📋 当前子用户ID:', request.user.currentSubUser?.id)

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()
    
    // 测试数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

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

    // 验证年龄格式
    if (age !== undefined && (isNaN(age) || age < 0 || age > 150)) {
      return createErrorResponse('年龄格式不正确', 400)
    }

    // 获取当前子用户ID
    const currentSubUserId = request.user.currentSubUser?.id

    // 构建微信用户更新数据
    const wechatUserUpdateData = {}
    if (nickname !== undefined) wechatUserUpdateData.nickname = nickname
    if (avatar !== undefined) wechatUserUpdateData.avatar = avatar
    if (gender !== undefined) wechatUserUpdateData.gender = gender.toString()
    wechatUserUpdateData.updatedAt = new Date()

    console.log('📋 微信用户更新数据:', wechatUserUpdateData)

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新微信用户信息（基本信息）
      const updatedWechatUser = await tx.wechatUser.update({
        where: { id: userId },
        data: wechatUserUpdateData,
        select: {
          id: true,
          nickname: true,
          avatar: true,
          gender: true,
          updatedAt: true
        }
      })

      console.log('✅ 微信用户更新完成:', updatedWechatUser)

      // 如果有子用户，同时更新子用户信息（详细个人信息）
      let updatedSubUser = null
      if (currentSubUserId) {
        // 构建子用户更新数据
        const subUserUpdateData = {}
        if (phone !== undefined) subUserUpdateData.phone = phone
        if (email !== undefined) subUserUpdateData.email = email
        if (gender !== undefined) subUserUpdateData.gender = gender.toString()
        if (age !== undefined) subUserUpdateData.age = parseInt(age)
        if (address !== undefined) subUserUpdateData.address = address
        subUserUpdateData.updatedAt = new Date()

        console.log('📋 子用户更新数据:', subUserUpdateData)

        updatedSubUser = await tx.subUser.update({
          where: { id: currentSubUserId },
          data: subUserUpdateData,
          select: {
            id: true,
            phone: true,
            email: true,
            gender: true,
            age: true,
            address: true,
            updatedAt: true
          }
        })

        console.log('✅ 子用户更新完成:', updatedSubUser)
      }

      // 如果更新了微信用户的昵称，需要同步更新默认用户的 username 和 realName
      let updatedDefaultSubUser = null
      if (nickname !== undefined) {
        console.log('🔄 检测到昵称更新，同步更新默认用户信息...')
        
        // 查找默认用户
        const defaultSubUser = await tx.subUser.findFirst({
          where: {
            wechatUserId: userId,
            isDefault: true,
            status: 'active'
          },
          select: {
            id: true,
            username: true,
            realName: true
          }
        })

        if (defaultSubUser) {
          console.log('📋 找到默认用户:', defaultSubUser)
          
          // 检查是否需要更新默认用户的用户名和真实姓名
          const needsUpdate = defaultSubUser.username !== nickname || defaultSubUser.realName !== nickname
          
          if (needsUpdate) {
            console.log('🔄 更新默认用户的用户名和真实姓名...')
            
            // 检查新的用户名是否与其他子用户冲突
            const existingSubUser = await tx.subUser.findFirst({
              where: {
                wechatUserId: userId,
                username: nickname,
                id: { not: defaultSubUser.id }
              }
            })

            let finalUsername = nickname
            if (existingSubUser) {
              // 如果用户名冲突，添加时间戳
              finalUsername = `${nickname}_${Date.now()}`
              console.log('⚠️ 用户名冲突，使用新用户名:', finalUsername)
            }

            updatedDefaultSubUser = await tx.subUser.update({
              where: { id: defaultSubUser.id },
              data: {
                username: finalUsername,
                realName: nickname,
                updatedAt: new Date()
              },
              select: {
                id: true,
                username: true,
                realName: true,
                updatedAt: true
              }
            })

            console.log('✅ 默认用户同步更新完成:', updatedDefaultSubUser)
          } else {
            console.log('✅ 默认用户信息已是最新，无需更新')
          }
        } else {
          console.log('⚠️ 未找到默认用户，跳过同步更新')
        }
      }

      return { updatedWechatUser, updatedSubUser, updatedDefaultSubUser }
    })

    const { updatedWechatUser, updatedSubUser, updatedDefaultSubUser } = result

    console.log('✅ 微信用户信息更新成功:', updatedWechatUser.nickname)
    if (updatedSubUser) {
      console.log('✅ 子用户信息更新成功:', updatedSubUser.id)
    }
    if (updatedDefaultSubUser) {
      console.log('✅ 默认用户同步更新成功:', updatedDefaultSubUser.username, updatedDefaultSubUser.realName)
    }

    // 验证更新结果
    const finalWechatUser = await prisma.wechatUser.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatar: true, gender: true, updatedAt: true }
    })
    console.log('🔍 验证微信用户更新结果:', finalWechatUser)

    if (currentSubUserId) {
      const finalSubUser = await prisma.subUser.findUnique({
        where: { id: currentSubUserId },
        select: { id: true, phone: true, email: true, gender: true, age: true, address: true, updatedAt: true }
      })
      console.log('🔍 验证子用户更新结果:', finalSubUser)
    }

    // 检查更新是否成功
    const updateSuccess = {
      wechatUser: finalWechatUser.nickname === (nickname !== undefined ? nickname : finalWechatUser.nickname),
      subUser: currentSubUserId ? true : null
    }
    console.log('🔍 更新成功检查:', updateSuccess)

    return createSuccessResponse({
      id: updatedWechatUser.id,
      nickname: updatedWechatUser.nickname,
      avatar: updatedWechatUser.avatar,
      avatarUrl: updatedWechatUser.avatar,
      gender: updatedSubUser?.gender || updatedWechatUser.gender,
      phone: updatedSubUser?.phone,
      email: updatedSubUser?.email,
      age: updatedSubUser?.age,
      address: updatedSubUser?.address,
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