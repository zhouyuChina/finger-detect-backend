import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

export async function POST(request) {
  let prisma = null
  try {
    console.log('📝 微信用户注册接口被调用')
    
    // 检查Content-Type
    const contentType = request.headers.get('content-type')
    console.log('📄 Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('❌ Content-Type错误:', contentType)
      return createErrorResponse('请求格式错误，请使用application/json', 400)
    }
    
    const body = await request.json()
    console.log('📤 接收到的请求体:', JSON.stringify(body, null, 2))
    
    const { 
      openid,
      unionid,
      nickname,
      avatar,
      gender,
      city,
      province,
      country,
      appVersion
    } = body

    // 验证必填字段
    if (!openid) {
      console.log('❌ openid缺失')
      return createErrorResponse('openid为必填项', 400)
    }
    
    if (openid.trim() === '') {
      console.log('❌ openid为空字符串')
      return createErrorResponse('openid不能为空', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 检查微信用户是否已存在
    let wechatUser = await prisma.wechatUser.findUnique({
      where: { openid },
      include: {
        subUsers: true
      }
    })

    if (wechatUser) {
      console.log('✅ 微信用户已存在:', wechatUser.nickname)
      
      // 如果用户已存在但没有子用户，创建默认子用户
      if (wechatUser.subUsers.length === 0) {
        console.log('📝 创建默认子用户...')
        const defaultUsername = nickname || `user_${openid.slice(-6)}`
        
        const defaultSubUser = await prisma.subUser.create({
          data: {
            wechatUserId: wechatUser.id,
            username: defaultUsername,
            realName: nickname || '默认用户',
            status: 'active'
          }
        })
        
        console.log('✅ 默认子用户创建成功:', defaultSubUser.realName)
        
        // 重新获取用户信息
        wechatUser = await prisma.wechatUser.findUnique({
          where: { openid },
          include: {
            subUsers: true
          }
        })
      }
      
      return createSuccessResponse({
        user: {
          id: wechatUser.id,
          openid: wechatUser.openid,
          nickname: wechatUser.nickname,
          subUsers: wechatUser.subUsers,
          currentSubUser: wechatUser.subUsers[0] || null
        }
      }, '用户登录成功')
    }

    // 2. 创建新的微信用户
    console.log('🆕 创建新微信用户...')
    
    // 如果提供了unionid，先检查是否已存在
    if (unionid) {
      const existingUserWithUnionid = await prisma.wechatUser.findUnique({
        where: { unionid }
      })
      if (existingUserWithUnionid) {
        console.log('❌ unionid已存在:', unionid)
        return createErrorResponse('该微信账号已被注册', 400)
      }
    }
    
    wechatUser = await prisma.wechatUser.create({
      data: {
        openid,
        unionid,
        nickname: nickname || '微信用户',
        avatar,
        gender: gender?.toString(),
        city,
        province,
        country,
        appVersion,
        status: 'active',
        registerTime: new Date(),
        lastLogin: new Date()
      }
    })

    console.log('✅ 微信用户创建成功:', wechatUser.nickname)

    // 3. 创建默认子用户
    console.log('📝 创建默认子用户...')
    const defaultUsername = nickname || `user_${openid.slice(-6)}`
    
    const defaultSubUser = await prisma.subUser.create({
      data: {
        wechatUserId: wechatUser.id,
        username: defaultUsername,
        realName: nickname || '默认用户',
        status: 'active'
      }
    })

    console.log('✅ 默认子用户创建成功:', defaultSubUser.realName)

    // 4. 获取完整的用户信息
    const completeUser = await prisma.wechatUser.findUnique({
      where: { openid },
      include: {
        subUsers: true
      }
    })

    return createSuccessResponse({
      user: {
        id: completeUser.id,
        openid: completeUser.openid,
        nickname: completeUser.nickname,
        subUsers: completeUser.subUsers,
        currentSubUser: completeUser.subUsers[0]
      }
    }, '用户注册成功')

  } catch (error) {
    console.error('❌ 用户注册错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('用户注册失败: ' + error.message)
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
        console.log('✅ Prisma连接已关闭')
      } catch (error) {
        console.error('❌ 关闭Prisma连接失败:', error)
      }
    }
  }
} 