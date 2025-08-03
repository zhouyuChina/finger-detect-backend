const https = require('node:https');
const http = require('node:http');

// 测试远程API
async function testRemoteAPI() {
  const baseUrl = 'http://47.76.126.85:4000';
  
  console.log('🧪 测试远程API...\n');
  
  // 1. 测试健康检查
  console.log('1. 测试健康检查:');
  try {
    const healthResponse = await makeRequest(`${baseUrl}/api/health`);
    console.log('✅ 健康检查成功');
    console.log('   环境:', healthResponse.data.environment);
    console.log('   数据库:', healthResponse.data.database.success ? '✅ 连接正常' : '❌ 连接失败');
    console.log('   Redis:', healthResponse.data.redis.success ? '✅ 连接正常' : '❌ 连接失败');
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  
  console.log('\n2. 测试检测API (无认证):');
  try {
    const detectionResponse = await makeRequest(`${baseUrl}/api/miniprogram/detection?username=subuser001`);
    console.log('✅ 检测API响应:', detectionResponse);
  } catch (error) {
    console.log('❌ 检测API失败:', error.message);
  }
  
  console.log('\n3. 测试检测API (带openid):');
  try {
    const detectionResponse = await makeRequest(
      `${baseUrl}/api/miniprogram/detection?username=subuser001`,
      {
        'x-openid': 'test_openid_001',
        'Content-Type': 'application/json'
      }
    );
    console.log('✅ 检测API响应:', detectionResponse);
  } catch (error) {
    console.log('❌ 检测API失败:', error.message);
  }
  
  console.log('\n4. 测试检测API (带错误的openid):');
  try {
    const detectionResponse = await makeRequest(
      `${baseUrl}/api/miniprogram/detection?username=subuser001`,
      {
        'x-openid': 'wrong_openid',
        'Content-Type': 'application/json'
      }
    );
    console.log('✅ 检测API响应:', detectionResponse);
  } catch (error) {
    console.log('❌ 检测API失败:', error.message);
  }
  
  console.log('\n5. 测试检测API (带错误的用户名):');
  try {
    const detectionResponse = await makeRequest(
      `${baseUrl}/api/miniprogram/detection?username=wrong_username`,
      {
        'x-openid': 'test_openid_001',
        'Content-Type': 'application/json'
      }
    );
    console.log('✅ 检测API响应:', detectionResponse);
  } catch (error) {
    console.log('❌ 检测API失败:', error.message);
  }
}

// 发送HTTP请求
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0',
        ...headers
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// 运行测试
testRemoteAPI()
  .then(() => {
    console.log('\n✅ 远程API测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 远程API测试失败:', error);
    process.exit(1);
  }); 