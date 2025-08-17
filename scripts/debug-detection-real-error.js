const { PrismaClient } = require('../src/generated/prisma/index.js');

async function debugDetectionRealError() {
  console.log('🔍 调试 detection-real 接口错误...\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');
    
    // 测试数据
    const testData = {
      subUserId: 'cmeeuy1pj002gplcdqm5xii1c',
      archiveId: 'cmeewh1dz002mplcdfl0gekys',
      detectionType: 'right_hand_index',
      base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsA'
    };
    
    console.log('📤 测试数据:', testData);
    
    // 1. 检查用户是否存在
    console.log('\n🔍 检查子用户...');
    const subUser = await prisma.subUser.findUnique({
      where: { id: testData.subUserId }
    });
    
    if (subUser) {
      console.log('✅ 子用户存在:', subUser.realName);
    } else {
      console.log('❌ 子用户不存在');
      return;
    }
    
    // 2. 检查档案是否存在
    console.log('\n🔍 检查档案...');
    const archive = await prisma.archive.findUnique({
      where: { id: testData.archiveId }
    });
    
    if (archive) {
      console.log('✅ 档案存在:', archive.archiveName);
    } else {
      console.log('❌ 档案不存在');
      return;
    }
    
    // 3. 测试base64处理
    console.log('\n🔍 测试base64处理...');
    const base64Data = testData.base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('base64长度:', base64Data.length);
    console.log('base64前20字符:', base64Data.substring(0, 20));
    
    // 4. 测试第三方检测服务
    console.log('\n🔍 测试第三方检测服务...');
    try {
      const response = await fetch('http://localhost:1008/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64_img: base64Data
        })
      });
      
      console.log('检测服务响应状态:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('检测服务响应:', result);
      } else {
        console.log('检测服务错误响应:', await response.text());
      }
    } catch (error) {
      console.error('❌ 检测服务连接失败:', error.message);
    }
    
    // 5. 测试文件保存
    console.log('\n🔍 测试文件保存...');
    try {
      const { writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'detections');
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `test_${Date.now()}.jpg`;
      const filePath = join(uploadDir, fileName);
      
      const buffer = Buffer.from(base64Data, 'base64');
      await writeFile(filePath, buffer);
      
      console.log('✅ 文件保存成功:', filePath);
    } catch (error) {
      console.error('❌ 文件保存失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugDetectionRealError().catch(console.error);
