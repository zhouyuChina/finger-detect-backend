import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

// 微信API调用函数
async function getWechatOpenid(code) {
  try {
    const appid = process.env.WECHAT_APP_ID
    const secret = process.env.WECHAT_APP_SECRET
    
    if (!appid || !secret) {
      return {
        success: false,
        message: '微信小程序配置缺失'
      }
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    
    console.log('📞 调用微信API:', url.replace(secret, '***'))
    
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('📄 微信API响应:', JSON.stringify(data, null, 2))
    
    if (data.errcode) {
      return {
        success: false,
        message: `微信API错误: ${data.errcode} - ${data.errmsg}`
      }
    }
    
    return {
      success: true,
      openid: data.openid,
      unionid: data.unionid,
      session_key: data.session_key
    }
  } catch (error) {
    console.error('❌ 微信API调用失败:', error.message)
    return {
      success: false,
      message: '微信API调用失败: ' + error.message
    }
  }
}

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
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.log('❌ JSON解析错误:', error.message)
      return createErrorResponse('请求体格式错误，请检查JSON格式', 400)
    }
    console.log('📤 接收到的请求体:', JSON.stringify(body, null, 2))
    
    const { 
      code,           // 微信登录code
      openid,         // 直接传入的openid（兼容旧版本）
      unionid,
      userInfo,       // 微信用户信息
      systemInfo,     // 系统信息
      registerTime,
      appVersion
    } = body

    // 提取用户信息
    const nickname = userInfo?.nickName || body.nickname
    const avatar = userInfo?.avatarUrl || body.avatar
    const gender = userInfo?.gender || body.gender
    const city = userInfo?.city || body.city
    const province = userInfo?.province || body.province
    const country = userInfo?.country || body.country

    let finalOpenid = openid
    let finalUnionid = unionid

    // 如果提供了code，则调用微信API换取openid
    if (code && !openid) {
      console.log('📞 使用微信登录code换取openid...')
      try {
        const wxResult = await getWechatOpenid(code)
        if (wxResult.success) {
          finalOpenid = wxResult.openid
          finalUnionid = wxResult.unionid
          console.log('✅ 微信API调用成功，openid:', finalOpenid)
        } else {
          console.log('❌ 微信API调用失败:', wxResult.message)
          return createErrorResponse('微信登录失败: ' + wxResult.message, 400)
        }
      } catch (error) {
        console.log('❌ 微信API调用异常:', error.message)
        return createErrorResponse('微信登录失败: ' + error.message, 400)
      }
    }

    // 验证必填字段
    if (!finalOpenid) {
      console.log('❌ openid缺失')
      return createErrorResponse('微信登录失败，无法获取用户身份', 400)
    }
    
    if (finalOpenid.trim() === '') {
      console.log('❌ openid为空字符串')
      return createErrorResponse('微信登录失败，无法获取用户身份', 400)
    }

    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 1. 检查微信用户是否已存在
    let wechatUser = await prisma.wechatUser.findUnique({
      where: { openid: finalOpenid },
      include: {
        subUsers: true
      }
    })

    if (wechatUser) {
      console.log('✅ 微信用户已存在:', wechatUser.nickname)
      
      // 如果用户已存在但没有子用户，创建默认子用户
      if (wechatUser.subUsers.length === 0) {
        console.log('📝 创建默认子用户...')
        let defaultUsername = nickname || `user_${openid.slice(-6)}`
        
        // 检查用户名是否已存在，如果存在则添加时间戳
        let existingSubUser = await prisma.subUser.findUnique({
          where: { username: defaultUsername }
        })
        
        if (existingSubUser) {
          console.log('⚠️ 用户名已存在，添加时间戳:', defaultUsername)
          defaultUsername = `${defaultUsername}_${Date.now()}`
        }
        
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
          where: { openid: finalOpenid },
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
    if (finalUnionid) {
      const existingUserWithUnionid = await prisma.wechatUser.findUnique({
        where: { unionid: finalUnionid }
      })
      if (existingUserWithUnionid) {
        console.log('❌ unionid已存在:', finalUnionid)
        return createErrorResponse('该微信账号已被注册', 400)
      }
    }
    
    wechatUser = await prisma.wechatUser.create({
      data: {
        openid: finalOpenid,
        unionid: finalUnionid,
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
    let defaultUsername = nickname || `user_${openid.slice(-6)}`
    
    // 检查用户名是否已存在，如果存在则添加时间戳
    let existingSubUser = await prisma.subUser.findUnique({
      where: { username: defaultUsername }
    })
    
    if (existingSubUser) {
      console.log('⚠️ 用户名已存在，添加时间戳:', defaultUsername)
      defaultUsername = `${defaultUsername}_${Date.now()}`
    }
    
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
      where: { openid: finalOpenid },
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