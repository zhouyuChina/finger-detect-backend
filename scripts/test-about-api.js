// 使用内置的 fetch (Node.js 18+)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

async function testAboutApi() {
  console.log('🧪 测试关于我们接口...')
  
  try {
    // 测试: 使用 openid 认证
    console.log('\n📋 测试关于我们接口')
    const response = await fetch(`${BASE_URL}/api/miniprogram/about`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-openid': 'test_openid_123'
      }
    })
    
    const result = await response.json()
    console.log('状态码:', response.status)
    console.log('响应:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ 接口测试成功!')
      console.log('📋 返回的公司信息:')
      console.log('  公司名称:', result.data.name)
      console.log('  公司描述:', result.data.description)
      console.log('  联系电话:', result.data.phone)
      console.log('  应用版本:', result.data.version)
    } else {
      console.log('\n❌ 接口测试失败:', result.message)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testAboutApi() 