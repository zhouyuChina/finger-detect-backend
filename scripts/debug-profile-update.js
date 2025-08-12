const { PrismaClient } = require('../src/generated/prisma/index.js')

async function debugProfileUpdate() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 调试profile更新API...')
    
    // 1. 查找一个测试用户
    const testUser = await prisma.wechatUser.findFirst({
      include: {
        subUsers: {
          take: 1
        }
      }
    })
    
    if (!testUser) {
      console.log('❌ 没有找到测试用户')
      return
    }
    
    console.log('📋 测试用户信息:')
    console.log('- 微信用户ID:', testUser.id)
    console.log('- 当前昵称:', testUser.nickname)
    console.log('- 子用户数量:', testUser.subUsers.length)
    
    if (testUser.subUsers.length > 0) {
      console.log('- 子用户ID:', testUser.subUsers[0].id)
      console.log('- 子用户姓名:', testUser.subUsers[0].realName)
    }
    
    // 2. 模拟API请求数据
    const requestData = {
      nickname: `调试昵称_${Date.now()}`,
      phone: '13800138000',
      email: 'debug@example.com',
      gender: '1'
    }
    
    console.log('\n📝 模拟请求数据:', JSON.stringify(requestData, null, 2))
    
    // 3. 模拟API逻辑
    const userId = testUser.id
    const currentSubUserId = testUser.subUsers[0]?.id
    
    console.log('\n🔧 开始模拟API更新逻辑...')
    
    // 构建微信用户更新数据
    const wechatUserUpdateData = {}
    if (requestData.nickname !== undefined) wechatUserUpdateData.nickname = requestData.nickname
    if (requestData.avatar !== undefined) wechatUserUpdateData.avatar = requestData.avatar
    if (requestData.gender !== undefined) wechatUserUpdateData.gender = requestData.gender.toString()
    wechatUserUpdateData.updatedAt = new Date()
    
    console.log('📋 微信用户更新数据:', wechatUserUpdateData)
    
    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 更新微信用户
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
      
      // 更新子用户
      let updatedSubUser = null
      if (currentSubUserId) {
        const subUserUpdateData = {}
        if (requestData.phone !== undefined) subUserUpdateData.phone = requestData.phone
        if (requestData.email !== undefined) subUserUpdateData.email = requestData.email
        if (requestData.gender !== undefined) subUserUpdateData.gender = requestData.gender.toString()
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
            updatedAt: true
          }
        })
        
        console.log('✅ 子用户更新完成:', updatedSubUser)
      }
      
      return { updatedWechatUser, updatedSubUser }
    })
    
    console.log('\n🎉 事务更新成功!')
    
    // 4. 验证更新结果
    const finalWechatUser = await prisma.wechatUser.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatar: true, gender: true, updatedAt: true }
    })
    
    console.log('\n🔍 最终微信用户数据:', finalWechatUser)
    
    if (currentSubUserId) {
      const finalSubUser = await prisma.subUser.findUnique({
        where: { id: currentSubUserId },
        select: { id: true, phone: true, email: true, gender: true, updatedAt: true }
      })
      console.log('🔍 最终子用户数据:', finalSubUser)
    }
    
    // 5. 检查更新是否成功
    const updateSuccess = {
      wechatUser: finalWechatUser.nickname === requestData.nickname,
      subUser: currentSubUserId ? true : null
    }
    
    console.log('\n✅ 更新验证结果:', updateSuccess)
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

debugProfileUpdate()
