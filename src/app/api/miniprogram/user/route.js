import { NextResponse } from 'next/server'

// 获取用户信息
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // TODO: 验证JWT token并获取用户信息
    // const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    // 模拟用户数据
    const mockUser = {
      id: 1,
      nickname: '微信用户',
      avatar: '',
      phone: '138****8888',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mockUser
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

// 更新用户信息
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { nickname, avatar, phone } = await request.json()
    
    // TODO: 验证JWT token并更新用户信息
    // const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // const user = await prisma.user.update({
    //   where: { id: decoded.userId },
    //   data: { nickname, avatar, phone }
    // })

    return NextResponse.json({
      success: true,
      message: '用户信息更新成功'
    })

  } catch (error) {
    console.error('更新用户信息错误:', error)
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
} 