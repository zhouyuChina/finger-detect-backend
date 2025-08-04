import { NextResponse } from 'next/server'
import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../../lib/miniprogramAuth.js'

async function debugUserInfo(request) {
  let prisma = null
  try {
    console.log('🔍 调试接口被调用')
    console.log('📋 当前微信用户ID:', request.user?.id)
    console.log('📋 当前微信用户openid:', request.user?.openid)
    
    // 创建 PrismaClient 实例
    const { PrismaClient } = await import('../../../../generated/prisma/index.js')
    prisma = new PrismaClient()

    // 获取当前微信用户的所有子用户
    const subUsers = await prisma.subUser.findMany({
      where: { wechatUserId: request.user.id },
      select: {
        id: true,
        username: true,
        realName: true,
        status: true,
        archives: true,
        photos: true,
        createdAt: true
      }
    })

    // 获取该微信用户的档案列表
    const archives = await prisma.archive.findMany({
      where: {
        subUserId: { in: subUsers.map(u => u.id) }
      },
      select: {
        id: true,
        archiveName: true,
        bodyPart: true,
        activity: true,
        photoCount: true,
        detectionTime: true,
        createdAt: true,
        subUser: {
          select: {
            username: true,
            realName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const debugInfo = {
      wechatUser: {
        id: request.user.id,
        openid: request.user.openid,
        nickname: request.user.nickname
      },
      subUsers: subUsers,
      archives: archives,
      totalArchives: archives.length
    }

    return createSuccessResponse(debugInfo, '调试信息获取成功')

  } catch (error) {
    console.error('❌ 调试接口错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return createErrorResponse(`调试失败: ${error.message}`)
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
      } catch (error) {
        console.error('关闭 Prisma 连接失败:', error)
      }
    }
  }
}

export const GET = miniprogramAuthMiddleware(debugUserInfo) 