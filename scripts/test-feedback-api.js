const BASE_URL = 'http://localhost:3001/api/miniprogram/feedback';

// 模拟JWT token（实际使用时需要真实的token）
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2MzU2NzIwMDAsImV4cCI6MTYzNTc1ODQwMH0.test-signature';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MOCK_TOKEN}`
};

async function testFeedbackAPI() {
  console.log('🧪 开始测试反馈API...\n');

  try {
    // 1. 测试获取反馈列表
    console.log('1️⃣ 测试获取反馈列表...');
    try {
      const listResponse = await fetch(`${BASE_URL}?page=1&pageSize=10`, { 
        method: 'GET',
        headers 
      });
      const listData = await listResponse.json();
      console.log('✅ 反馈列表接口响应:', JSON.stringify(listData, null, 2));
    } catch (error) {
      console.log('❌ 反馈列表接口错误:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 测试提交反馈
    console.log('2️⃣ 测试提交反馈...');
    try {
      const feedbackData = {
        type: 'bug',
        title: '测试反馈标题',
        content: '这是一个测试反馈内容，用于验证API功能是否正常。',
        images: []
      };

      const submitResponse = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(feedbackData)
      });
      const submitData = await submitResponse.json();
      console.log('✅ 提交反馈接口响应:', JSON.stringify(submitData, null, 2));
    } catch (error) {
      console.log('❌ 提交反馈接口错误:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 测试获取反馈详情（需要先有反馈ID）
    console.log('3️⃣ 测试获取反馈详情...');
    try {
      const detailResponse = await fetch(`${BASE_URL}/test-feedback-id`, { 
        method: 'GET',
        headers 
      });
      const detailData = await detailResponse.json();
      console.log('✅ 反馈详情接口响应:', JSON.stringify(detailData, null, 2));
    } catch (error) {
      console.log('❌ 反馈详情接口错误:', error.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }

  console.log('\n🏁 测试完成！');
}

// 运行测试
testFeedbackAPI(); 