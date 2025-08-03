async function testRegister400() {
  console.log('🧪 测试注册API的400错误情况...\n')

  // 测试1: 缺少openid
  console.log('📝 测试1: 缺少openid')
  try {
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: '测试用户',
        unionid: 'test_unionid_' + Date.now()
      })
    })
    
    console.log('状态码:', response.status)
    const data = await response.text()
    console.log('响应:', data)
    console.log('---\n')
  } catch (error) {
    console.error('错误:', error.message)
  }

  // 测试2: 空openid
  console.log('📝 测试2: 空openid')
  try {
    const response = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openid: '',
        nickname: '测试用户',
        unionid: 'test_unionid_' + Date.now()
      })
    })
    
    console.log('状态码:', response.status)
    const data = await response.text()
    console.log('响应:', data)
    console.log('---\n')
  } catch (error) {
    console.error('错误:', error.message)
  }

  // 测试3: 重复的unionid
  console.log('📝 测试3: 重复的unionid')
  const duplicateUnionid = 'duplicate_unionid_' + Date.now()
  try {
    // 第一次注册
    const response1 = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openid: 'test_openid_1_' + Date.now(),
        unionid: duplicateUnionid,
        nickname: '测试用户1'
      })
    })
    console.log('第一次注册状态码:', response1.status)
    
    // 第二次注册（重复unionid）
    const response2 = await fetch('http://47.76.126.85:4000/api/miniprogram/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openid: 'test_openid_2_' + Date.now(),
        unionid: duplicateUnionid,
        nickname: '测试用户2'
      })
    })
    console.log('第二次注册状态码:', response2.status)
    const data2 = await response2.text()
    console.log('第二次注册响应:', data2)
  } catch (error) {
    console.error('错误:', error.message)
  }
}

testRegister400() 