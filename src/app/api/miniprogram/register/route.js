import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma/index.js'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// 调用微信官方接口换取 openId
async function getWechatOpenId(code) {
  try {
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET
    
    // 开发环境如果没有配置，使用模拟数据
    if (process.env.NODE_ENV === 'development' && (!appId || !appSecret)) {
      console.log('🔧 开发环境：微信小程序配置缺失，使用模拟数据')
      return {
        openid: `openid_${Date.now()}`,
        unionid: `unionid_${Date.now()}`,
        sessionKey: 'mock_session_key'
      }
    }
    
    if (!appId || !appSecret) {
      throw new Error('微信小程序配置缺失')
    }

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    )

    const data = await response.json()
    
    if (data.errcode) {
      throw new Error(`微信接口错误: ${data.errmsg}`)
    }

    return {
      openid: data.openid,
      unionid: data.unionid || null,
      sessionKey: data.session_key
    }
  } catch (error) {
    console.error('获取微信 openId 失败:', error)
    throw error
  }
}

// 生成 JWT token
function generateToken(userId, openid, nickname) {
  return jwt.sign(
    {
      userId: userId,
      openid: openid,
      nickname: nickname
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  )
}

// 用户注册接口
export async function POST(request) {
  try {
    console.log('🔐 用户注册接口被调用')
    
    const body = await request.json()
    const { code, userInfo, systemInfo, registerTime, appVersion } = body

    if (!code) {
      return createErrorResponse('缺少微信登录凭证', 400)
    }

    if (!userInfo || !userInfo.nickName) {
      return createErrorResponse('缺少用户信息', 400)
    }

    // 调用微信接口获取 openId（开发环境使用模拟数据）
    let wechatData
    if (process.env.NODE_ENV === 'development' && code === 'test_code') {
      // 开发环境使用模拟数据
      wechatData = {
        openid: `openid_${Date.now()}`,
        unionid: `unionid_${Date.now()}`,
        sessionKey: 'mock_session_key'
      }
      console.log('🔧 开发环境使用模拟数据:', wechatData.openid)
    } else {
      // 生产环境调用真实微信接口
      wechatData = await getWechatOpenId(code)
      console.log('✅ 获取微信 openId 成功:', wechatData.openid)
    }

    // 检查用户是否已存在（使用 openid 字段查询）
    const existingUser = await prisma.user.findUnique({
      where: { openid: wechatData.openid },
      include: { systemInfo: true }
    })

    let user
    let isNewUser = false

    if (existingUser) {
      // 用户已存在，更新信息
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          gender: userInfo.gender?.toString(),
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
          lastLogin: new Date(),
          appVersion: appVersion,
          updatedAt: new Date()
        },
        include: { systemInfo: true }
      })

      // 更新系统信息
      if (systemInfo) {
        await prisma.userSystemInfo.upsert({
          where: { userId: user.id },
          update: {
            platform: systemInfo.platform,
            system: systemInfo.system,
            version: systemInfo.version,
            SDKVersion: systemInfo.SDKVersion,
            brand: systemInfo.brand,
            model: systemInfo.model,
            screenWidth: systemInfo.screenWidth,
            screenHeight: systemInfo.screenHeight,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            pixelRatio: systemInfo.pixelRatio,
            language: systemInfo.language,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            platform: systemInfo.platform,
            system: systemInfo.system,
            version: systemInfo.version,
            SDKVersion: systemInfo.SDKVersion,
            brand: systemInfo.brand,
            model: systemInfo.model,
            screenWidth: systemInfo.screenWidth,
            screenHeight: systemInfo.screenHeight,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            pixelRatio: systemInfo.pixelRatio,
            language: systemInfo.language
          }
        })
      }
    } else {
      // 新用户，创建记录
      isNewUser = true

      user = await prisma.user.create({
        data: {
          openid: wechatData.openid,
          unionid: wechatData.unionid,
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          gender: userInfo.gender?.toString(),
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
          appVersion: appVersion,
          registerTime: registerTime ? new Date(registerTime) : new Date(),
          lastLogin: new Date()
        },
        include: { systemInfo: true }
      })

      // 创建系统信息记录
      if (systemInfo) {
        await prisma.userSystemInfo.create({
          data: {
            userId: user.id,
            platform: systemInfo.platform,
            system: systemInfo.system,
            version: systemInfo.version,
            SDKVersion: systemInfo.SDKVersion,
            brand: systemInfo.brand,
            model: systemInfo.model,
            screenWidth: systemInfo.screenWidth,
            screenHeight: systemInfo.screenHeight,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            pixelRatio: systemInfo.pixelRatio,
            language: systemInfo.language
          }
        })
      }
    }

    // 生成 JWT token
    const token = generateToken(user.id, user.openid, user.nickname)

    // 构建响应数据
    const responseData = {
      userId: user.id,
      openId: user.openid,
      unionId: user.unionid,
      token: token,
      userInfo: {
        id: user.id,
        nickName: user.nickname,
        avatarUrl: user.avatar,
        gender: parseInt(user.gender || '0'),
        country: user.country,
        province: user.province,
        city: user.city,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      isNewUser: isNewUser
    }

    console.log('✅ 用户注册成功:', { userId: user.id, isNewUser })

    return createSuccessResponse(responseData, '注册成功')

  } catch (error) {
    console.error('❌ 用户注册失败:', error.message)
    console.error('错误堆栈:', error.stack)
    
    if (error.message.includes('微信接口错误')) {
      return createErrorResponse('微信登录失败，请重试', 400)
    }
    
    if (error.message.includes('微信小程序配置缺失')) {
      return createErrorResponse('系统配置错误', 500)
    }
    
    if (error.message.includes('Invalid JSON')) {
      return createErrorResponse('请求数据格式错误', 400)
    }
    
    return createErrorResponse('注册失败，请重试')
  } finally {
    await prisma.$disconnect()
  }
} 