const BASE_URL = 'http://localhost:3001/api/miniprogram/feedback';

// 模拟JWT token（实际使用时需要真实的token）
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2MzU2NzIwMDAsImV4cCI6MTYzNTc1ODQwMH0.test-signature';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MOCK_TOKEN}`
};

async function testDetailAPI() {
  console.log('🧪 测试反馈详情API...\n');

  const feedbackId = 'cmdz539eu0002s6iun4z7uk0d';

  try {
    console.log('1️⃣ 测试获取反馈详情...');
    console.log('📋 反馈ID:', feedbackId);
    
    const detailResponse = await fetch(`${BASE_URL}/${feedbackId}`, { 
      method: 'GET',
      headers 
    });
    
    console.log('📊 响应状态:', detailResponse.status);
    console.log('📊 响应头:', Object.fromEntries(detailResponse.headers.entries()));
    
    const detailData = await detailResponse.json();
    console.log('✅ 反馈详情接口响应:', JSON.stringify(detailData, null, 2));
    
  } catch (error) {
    console.log('❌ 反馈详情接口错误:', error.message);
  }

  console.log('\n🏁 测试完成！');
}

// 运行测试
testDetailAPI(); 