async function testRegisterAPI() {
  const testData = {
    openid: 'test_openid_register_' + Date.now(),
    unionid: 'test_unionid_' + Date.now(),
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.jpg',
    gender: 1,
    city: '深圳',
    province: '广东',
    country: '中国',
    appVersion: '1.0.0'
  }

  try {
    console.log('🧪 测试注册API...')
    console.log('📤 发送数据:', JSON.stringify(testData, null, 2))
    
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    console.log('📊 响应状态:', response.status)
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 响应内容:', responseText)
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('✅ 注册成功:', data)
    } else {
      console.log('❌ 注册失败:', responseText)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testRegisterAPI() 