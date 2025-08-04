import { miniprogramAuthMiddleware, createSuccessResponse, createErrorResponse } from '../../../lib/miniprogramAuth.js'

async function testAuth(request) {
  try {
    console.log('🧪 测试认证API')
    console.log('📋 request.user:', request.user)
    
    if (!request.user) {
      return createErrorResponse('认证失败：request.user为空', 401)
    }
    
    return createSuccessResponse({
      user: {
        id: request.user.id,
        openid: request.user.openid,
        nickname: request.user.nickname,
        subUsersCount: request.user.subUsers?.length || 0,
        currentSubUser: request.user.currentSubUser ? {
          id: request.user.currentSubUser.id,
          username: request.user.currentSubUser.username,
          realName: request.user.currentSubUser.realName
        } : null
      }
    }, '认证成功')
    
  } catch (error) {
    console.error('❌ 测试认证API错误:', error)
    return createErrorResponse(`测试认证API失败: ${error.message}`)
  }
}

export const GET = miniprogramAuthMiddleware(testAuth) 