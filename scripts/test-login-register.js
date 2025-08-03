async function testLoginRegister() {
  console.log('🧪 测试登录/注册统一接口...\n')

  const baseUrl = 'http://47.76.126.85:4000/api/miniprogram/register'
  
  // 测试数据
  const testUsers = [
    {
      name: '新用户注册',
      data: {
        openid: 'new_user_' + Date.now(),
        unionid: 'new_unionid_' + Date.now(),
        nickname: '新用户',
        avatar: 'https://example.com/avatar1.jpg',
        gender: 1,
        city: '深圳',
        province: '广东',
        country: '中国',
        appVersion: '1.0.0'
      }
    },
    {
      name: '老用户登录',
      data: {
        openid: 'existing_user_001', // 假设这个用户已存在
        nickname: '老用户',
        appVersion: '1.0.0'
      }
    },
    {
      name: '微信小程序登录（简化数据）',
      data: {
        openid: 'miniprogram_user_' + Date.now(),
        nickname: '小程序用户'
      }
    }
  ]

  for (const testCase of testUsers) {
    console.log(`📝 测试: ${testCase.name}`)
    console.log('📤 发送数据:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      })

      console.log('📊 响应状态:', response.status)
      
      const responseText = await response.text()
      console.log('📄 响应内容:', responseText)
      
      if (response.ok) {
        const data = JSON.parse(responseText)
        console.log('✅ 成功:', data.message)
        if (data.data?.user) {
          console.log('👤 用户ID:', data.data.user.id)
          console.log('👥 子用户数量:', data.data.user.subUsers?.length || 0)
        }
      } else {
        console.log('❌ 失败:', responseText)
      }
    } catch (error) {
      console.error('❌ 请求失败:', error.message)
    }
    
    console.log('---\n')
  }

  // 测试错误情况
  console.log('📝 测试错误情况')
  
  const errorTests = [
    {
      name: '缺少openid',
      data: { nickname: '测试用户' }
    },
    {
      name: '空openid',
      data: { openid: '', nickname: '测试用户' }
    },
    {
      name: '错误的Content-Type',
      headers: { 'Content-Type': 'text/plain' },
      data: { openid: 'test_' + Date.now(), nickname: '测试用户' }
    }
  ]

  for (const testCase of errorTests) {
    console.log(`📝 错误测试: ${testCase.name}`)
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: testCase.headers || { 'Content-Type': 'application/json' },
        body: testCase.headers?.['Content-Type'] === 'text/plain' 
          ? testCase.data.nickname 
          : JSON.stringify(testCase.data)
      })

      console.log('📊 响应状态:', response.status)
      const responseText = await response.text()
      console.log('📄 响应内容:', responseText)
    } catch (error) {
      console.error('❌ 请求失败:', error.message)
    }
    
    console.log('---\n')
  }
}

testLoginRegister() 