import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../../src/generated/prisma/index.js'

export async function POST(request) {
  let prisma = null
  try {
    console.log('🧪 测试检测API被调用')
    
    const body = await request.json()
    console.log('📋 请求体:', body)
    
    const { 
      username,
      archiveName, 
      detectionType = 'left_hand_thumb',
      imageUrl
    } = body

    // 验证必填字段
    if (!username || !archiveName || !imageUrl) {
      return NextResponse.json({
        success: false,
        message: '用户名、档案名称和图片URL为必填项',
        code: 400
      }, { status: 400 })
    }

    // 验证检测类型
    const validTypes = [
      'left_hand_thumb', 'left_hand_index', 'left_hand_middle', 'left_hand_ring', 'left_hand_little',
      'right_hand_thumb', 'right_hand_index', 'right_hand_middle', 'right_hand_ring', 'right_hand_little',
      'left_foot_big', 'left_foot_second', 'left_foot_third', 'left_foot_fourth', 'left_foot_little',
      'right_foot_big', 'right_foot_second', 'right_foot_third', 'right_foot_fourth', 'right_foot_little'
    ]
    if (!validTypes.includes(detectionType)) {
      return NextResponse.json({
        success: false,
        message: '检测类型无效',
        code: 400
      }, { status: 400 })
    }

    console.log('✅ 参数验证通过')

    // 创建 PrismaClient 实例
    prisma = new PrismaClient()
    console.log('✅ Prisma客户端创建成功')

    // 查找微信用户
    const wechatUser = await prisma.wechatUser.findUnique({
      where: { openid: 'test_openid_001' }
    })

    if (!wechatUser) {
      return NextResponse.json({
        success: false,
        message: '微信用户不存在',
        code: 404
      }, { status: 404 })
    }

    console.log('✅ 找到微信用户:', wechatUser.nickname)

    // 查找子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: wechatUser.id,
        username: username,
        status: 'active'
      }
    })

    if (!subUser) {
      return NextResponse.json({
        success: false,
        message: '子用户不存在',
        code: 404
      }, { status: 404 })
    }

    console.log('✅ 找到子用户:', subUser.realName)

    // 模拟第三方检测服务
    console.log('🔄 调用第三方检测服务...')
    const thirdPartyResult = {
      success: true,
      data: {
        imageUrl: imageUrl,
        description: `${detectionType} 检测结果正常`,
        suggestion: '建议继续保持良好的卫生习惯',
        result: 'normal',
        confidence: 0.95,
        detectionType: detectionType,
        timestamp: new Date().toISOString()
      }
    }

    console.log('✅ 第三方检测服务调用成功')

    // 创建检测记录
    console.log('📝 创建检测记录...')
    const newDetection = await prisma.detection.create({
      data: {
        subUserId: subUser.id,
        archiveName,
        detectionType,
        imageUrl,
        result: thirdPartyResult.data.result,
        confidence: thirdPartyResult.data.confidence,
        status: 'completed',
        remark: `测试检测记录 - ${detectionType}`
      }
    })

    console.log('✅ 检测记录创建成功:', newDetection.id)

    return NextResponse.json({
      success: true,
      message: '检测完成',
      data: {
        detection: newDetection,
        thirdPartyResult: thirdPartyResult.data
      },
      code: 200
    })

  } catch (error) {
    console.error('❌ 测试API错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return NextResponse.json({
      success: false,
      message: '测试API失败: ' + error.message,
      code: 500
    }, { status: 500 })
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