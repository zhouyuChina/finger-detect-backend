import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 微信小程序登录接口 - GET方法（支持URL参数）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    console.log('微信登录请求参数:', { code, searchParams: Object.fromEntries(searchParams) })
    
    // 如果没有code，返回测试token（仅用于开发测试）
    if (!code) {
      console.log('没有提供code，返回测试token')
      
      const mockUser = {
        id: 1,
        openid: 'test_openid_' + Date.now(),
        nickname: '测试用户',
        avatar: ''
      }

      const token = jwt.sign(
        {
          userId: mockUser.id,
          openid: mockUser.openid,
          nickname: mockUser.nickname
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        success: true,
        data: {
          token,
          openid: mockUser.openid,
          userInfo: {
            id: mockUser.id,
            nickname: mockUser.nickname,
            avatar: mockUser.avatar
          }
        },
        message: '测试登录成功（开发模式）'
      })
    }

    // TODO: 调用微信API获取openid和session_key
    // const wxResponse = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
    // const wxData = await wxResponse.json()
    
    // 模拟返回数据
    const mockResponse = {
      openid: 'mock_openid_' + Date.now(),
      session_key: 'mock_session_key',
      unionid: 'mock_unionid'
    }

    // TODO: 根据openid查找或创建用户
    // const user = await prisma.user.findUnique({ where: { openid: mockResponse.openid } })
    // if (!user) {
    //   user = await prisma.user.create({ data: { openid: mockResponse.openid } })
    // }

    // 模拟用户数据
    const mockUser = {
      id: 1,
      openid: mockResponse.openid,
      nickname: '微信用户',
      avatar: ''
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: mockUser.id,
        openid: mockUser.openid,
        nickname: mockUser.nickname
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // token有效期7天
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        openid: mockUser.openid,
        userInfo: {
          id: mockUser.id,
          nickname: mockUser.nickname,
          avatar: mockUser.avatar
        }
      }
    })

  } catch (error) {
    console.error('微信登录错误:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}

// 微信小程序登录接口 - POST方法（支持JSON body）
export async function POST(request) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: '缺少微信登录code' },
        { status: 400 }
      )
    }

    // TODO: 调用微信API获取openid和session_key
    // const wxResponse = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
    // const wxData = await wxResponse.json()
    
    // 模拟返回数据
    const mockResponse = {
      openid: 'mock_openid_' + Date.now(),
      session_key: 'mock_session_key',
      unionid: 'mock_unionid'
    }

    // TODO: 根据openid查找或创建用户
    // const user = await prisma.user.findUnique({ where: { openid: mockResponse.openid } })
    // if (!user) {
    //   user = await prisma.user.create({ data: { openid: mockResponse.openid } })
    // }

    // 模拟用户数据
    const mockUser = {
      id: 1,
      openid: mockResponse.openid,
      nickname: '微信用户',
      avatar: ''
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: mockUser.id,
        openid: mockUser.openid,
        nickname: mockUser.nickname
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // token有效期7天
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        openid: mockUser.openid,
        userInfo: {
          id: mockUser.id,
          nickname: mockUser.nickname,
          avatar: mockUser.avatar
        }
      }
    })

  } catch (error) {
    console.error('微信登录错误:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
} 