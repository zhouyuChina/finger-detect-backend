async function testWechatCodeLogin() {
  console.log('🧪 测试微信登录code功能...\n')

  // 模拟你提供的真实请求数据
  const realRequestData = {
    "code": "0b1HquFa1z1e3K0vlzIa1Bw3qt2HquFF",
    "userInfo": {
      "nickName": "微信用户",
      "gender": 0,
      "language": "",
      "city": "",
      "province": "",
      "country": "",
      "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
      "is_demote": true
    },
    "systemInfo": {
      "platform": "devtools",
      "system": "iOS 10.0.1",
      "version": "8.0.5",
      "SDKVersion": "3.8.7",
      "brand": "devtools",
      "model": "iPhone 12/13 (Pro)",
      "screenWidth": 390,
      "screenHeight": 844,
      "windowWidth": 390,
      "windowHeight": 753,
      "pixelRatio": 3,
      "language": "zh_CN"
    },
    "registerTime": "2025-08-03T22:57:16.250Z",
    "appVersion": "1.0.0"
  }

  console.log('📝 测试真实微信登录请求')
  console.log('📤 发送数据:', JSON.stringify(realRequestData, null, 2))
  
  try {
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realRequestData)
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

  console.log('\n---\n')

  // 测试兼容性：直接传入openid（旧版本）
  console.log('📝 测试兼容性：直接传入openid')
  const compatibilityData = {
    "openid": "test_openid_compat_" + Date.now(),
    "nickname": "兼容性测试用户",
    "appVersion": "1.0.0"
  }

  console.log('📤 发送数据:', JSON.stringify(compatibilityData, null, 2))
  
  try {
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(compatibilityData)
    })

    console.log('📊 响应状态:', response.status)
    
    const responseText = await response.text()
    console.log('📄 响应内容:', responseText)
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('✅ 兼容性测试成功:', data.message)
    } else {
      console.log('❌ 兼容性测试失败:', responseText)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

testWechatCodeLogin() 