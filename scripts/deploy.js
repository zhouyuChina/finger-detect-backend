const { execSync } = require('node:child_process');

console.log('🚀 开始部署准备...');

try {
  // 生成 Prisma 客户端
  console.log('📦 生成 Prisma 客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 运行数据库迁移
  console.log('🗄️ 运行数据库迁移...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('✅ 部署准备完成！');
} catch (error) {
  console.error('❌ 部署准备失败:', error.message);
  process.exit(1);
} 