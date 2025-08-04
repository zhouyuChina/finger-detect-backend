#!/bin/bash

echo "🚨 快速重置数据库脚本"
echo "⚠️  警告：此操作将删除所有数据！"
echo ""

read -p "确认要继续吗？(输入 'yes' 继续): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🔄 开始重置数据库..."

# 1. 停止应用服务
echo "📦 停止应用服务..."
pm2 stop all

# 2. 备份数据库
echo "💾 备份数据库..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
docker exec finger-detect-postgres pg_dump -U postgres finger_detect_db > backups/$(date +%Y%m%d_%H%M%S)/backup.sql
echo "✅ 备份完成：backups/$(date +%Y%m%d_%H%M%S)/backup.sql"

# 3. 清空数据库
echo "🗑️  清空数据库..."
docker exec -i finger-detect-postgres psql -U postgres << EOF
DROP DATABASE IF EXISTS finger_detect_db;
CREATE DATABASE finger_detect_db;
\q
EOF

# 4. 拉取最新代码
echo "📥 拉取最新代码..."
git checkout dev
git pull origin dev

# 5. 安装依赖
echo "📦 安装依赖..."
npm install
npx prisma generate

# 6. 重置迁移
echo "🔄 重置迁移..."
npx prisma migrate reset --force

# 7. 应用迁移
echo "📋 应用迁移..."
npx prisma migrate deploy

# 8. 创建初始数据
echo "👥 创建初始数据..."
node scripts/init-db.js

# 9. 启动服务
echo "🚀 启动服务..."
pm2 start all

# 10. 验证
echo "✅ 验证服务状态..."
pm2 status

echo ""
echo "🎉 数据库重置完成！"
echo "📋 可以测试以下API："
echo "  - 健康检查: curl http://47.76.126.85:4000/api/health"
echo "  - 档案API: curl http://47.76.126.85:4000/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7"
echo ""
echo "📁 备份文件位置: backups/$(date +%Y%m%d_%H%M%S)/backup.sql" 