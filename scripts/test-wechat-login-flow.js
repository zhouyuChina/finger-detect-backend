async function testWechatLoginFlow() {
  console.log('🧪 模拟微信登录流程测试...\n')

  // 模拟微信登录的几种情况
  const testCases = [
    {
      name: '正常微信登录（有openid）',
      data: {
        openid: 'wx_openid_' + Date.now(),
        unionid: 'wx_unionid_' + Date.now(),
        nickname: '微信用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/xxx',
        gender: 1,
        city: '深圳',
        province: '广东',
        country: '中国',
        appVersion: '1.0.0'
      }
    },
    {
      name: '微信登录失败（无openid）',
      data: {
        nickname: '微信用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/xxx',
        gender: 1,
        city: '深圳',
        province: '广东',
        country: '中国',
        appVersion: '1.0.0'
      }
    },
    {
      name: '微信登录code过期',
      data: {
        openid: '', // 空openid表示code已过期
        nickname: '微信用户',
        appVersion: '1.0.0'
      }
    },
    {
      name: '网络问题导致请求不完整',
      data: {
        // 模拟请求体被截断的情况
        nickname: '微信用户'
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`)
    console.log('📤 发送数据:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
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
      } else {
        console.log('❌ 失败:', responseText)
      }
    } catch (error) {
      console.error('❌ 请求失败:', error.message)
    }
    
    console.log('---\n')
  }

  // 测试微信登录code处理（如果接口支持的话）
  console.log('📝 测试微信登录code处理')
  
  const codeTestCases = [
    {
      name: '发送微信登录code',
      data: {
        code: 'test_wx_code_' + Date.now(),
        nickname: '微信用户',
        appVersion: '1.0.0'
      }
    },
    {
      name: '发送无效的code',
      data: {
        code: 'invalid_code',
        nickname: '微信用户',
        appVersion: '1.0.0'
      }
    }
  ]

  for (const testCase of codeTestCases) {
    console.log(`📝 测试: ${testCase.name}`)
    console.log('📤 发送数据:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
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

testWechatLoginFlow() 