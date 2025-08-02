import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../../lib/miniprogramAuth.js'

// 同步微信用户信息
async function syncWechatUserInfo(request) {
  let prisma = null
  try {
    console.log('🔄 同步微信用户信息接口被调用')
    
    const userId = request.user.id
    const openid = request.user.openid

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 检查微信配置
    if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
      return createErrorResponse('微信配置缺失，无法同步用户信息', 500)
    }

    // 获取 access_token
    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`
    )
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('获取 access_token 失败:', tokenData)
      return createErrorResponse('获取微信访问令牌失败', 500)
    }

    // 通过 openid 获取用户信息
    const userInfoResponse = await fetch(
      `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${tokenData.access_token}&openid=${openid}&lang=zh_CN`
    )
    const wechatUserInfo = await userInfoResponse.json()
    
    if (wechatUserInfo.errcode) {
      console.error('获取微信用户信息失败:', wechatUserInfo)
      return createErrorResponse('获取微信用户信息失败', 500)
    }

    console.log('✅ 获取到微信用户信息:', wechatUserInfo.nickname)

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: wechatUserInfo.nickname || '微信用户',
        avatar: wechatUserInfo.headimgurl,
        gender: wechatUserInfo.sex?.toString(),
        country: wechatUserInfo.country,
        province: wechatUserInfo.province,
        city: wechatUserInfo.city,
        updatedAt: new Date()
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        country: true,
        province: true,
        city: true,
        updatedAt: true
      }
    })

    console.log('✅ 用户信息同步成功:', updatedUser.nickname)

    return createSuccessResponse({
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      avatarUrl: updatedUser.avatar,
      gender: updatedUser.gender,
      country: updatedUser.country,
      province: updatedUser.province,
      city: updatedUser.city,
      updatedAt: updatedUser.updatedAt
    }, '用户信息同步成功')

  } catch (error) {
    console.error('❌ 同步微信用户信息错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse('同步微信用户信息失败')
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
export const POST = miniprogramAuthMiddleware(syncWechatUserInfo) 