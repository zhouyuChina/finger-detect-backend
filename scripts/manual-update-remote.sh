#!/bin/bash

echo "🔧 手动更新远程服务器数据库"
echo "请按步骤执行以下命令："

echo ""
echo "1️⃣ 首先测试SSH连接："
echo "ssh root@47.76.126.85"
echo ""

echo "2️⃣ 进入项目目录："
echo "cd /www/wwwroot/finger-detect-backend"
echo ""

echo "3️⃣ 备份数据库："
echo "docker exec finger-detect-postgres pg_dump -U postgres finger_detect_db > backup_\$(date +%Y%m%d_%H%M%S).sql"
echo ""

echo "4️⃣ 拉取最新代码："
echo "git pull origin dev"
echo ""

echo "5️⃣ 安装依赖："
echo "npm install"
echo ""

echo "6️⃣ 生成Prisma客户端："
echo "npx prisma generate"
echo ""

echo "7️⃣ 检查迁移状态："
echo "npx prisma migrate status"
echo ""

echo "8️⃣ 应用数据库迁移："
echo "npx prisma migrate deploy"
echo ""

echo "9️⃣ 验证数据库结构："
echo "npx prisma db pull"
echo ""

echo "🔟 重启应用服务："
echo "pm2 restart all"
echo ""

echo "✅ 完成后可以测试API："
echo "curl http://47.76.126.85:4000/api/health"
echo "curl http://47.76.126.85:4000/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7" 