// 配置
const BASE_URL = 'http://localhost:3001'
const TEST_OPENID = 'oJxdMvo4dM2s4FHkuZqoucCJavnU'

async function testCouponAPI() {
  console.log('🧪 测试优惠券API...')
  
  const headers = {
    'x-openid': TEST_OPENID,
    'Content-Type': 'application/json'
  }

  try {
    // 测试1: 获取所有优惠券
    console.log('\n📋 测试1: 获取所有优惠券')
    const response1 = await fetch(`${BASE_URL}/api/miniprogram/coupons?page=1&pageSize=10`, { headers })
    const data1 = await response1.json()
    console.log('状态码:', response1.status)
    console.log('响应数据:', JSON.stringify(data1, null, 2))

    // 测试2: 获取未使用的优惠券
    console.log('\n📋 测试2: 获取未使用的优惠券')
    const response2 = await fetch(`${BASE_URL}/api/miniprogram/coupons?page=1&pageSize=10&status=unused`, { headers })
    const data2 = await response2.json()
    console.log('状态码:', response2.status)
    console.log('响应数据:', JSON.stringify(data2, null, 2))

    // 测试3: 获取可用的优惠券
    console.log('\n📋 测试3: 获取可用的优惠券')
    const response3 = await fetch(`${BASE_URL}/api/miniprogram/coupons?page=1&pageSize=10&status=available`, { headers })
    const data3 = await response3.json()
    console.log('状态码:', response3.status)
    console.log('响应数据:', JSON.stringify(data3, null, 2))

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testCouponAPI() 