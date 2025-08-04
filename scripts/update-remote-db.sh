#!/bin/bash

echo "🚀 开始更新远程服务器数据库..."

# 远程服务器信息
REMOTE_HOST="47.76.126.85"
REMOTE_PORT="4000"
REMOTE_USER="root"
REMOTE_DIR="/www/wwwroot/finger-detect-backend"

echo "📋 远程服务器信息："
echo "  - 主机: $REMOTE_HOST"
echo "  - 端口: $REMOTE_PORT"
echo "  - 用户: $REMOTE_USER"
echo "  - 目录: $REMOTE_DIR"

# 1. 备份当前数据库（可选）
echo "📦 备份当前数据库..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker exec finger-detect-postgres pg_dump -U postgres finger_detect_db > backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && git pull origin dev"

# 3. 安装依赖（如果需要）
echo "📦 安装依赖..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npm install"

# 4. 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npx prisma generate"

# 5. 检查迁移状态
echo "🔍 检查迁移状态..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npx prisma migrate status"

# 6. 应用数据库迁移
echo "🔄 应用数据库迁移..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npx prisma migrate deploy"

# 7. 验证数据库结构
echo "✅ 验证数据库结构..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npx prisma db pull"

# 8. 重启应用服务
echo "🔄 重启应用服务..."
ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && pm2 restart all"

echo "🎉 远程数据库更新完成！"
echo "📋 可以测试以下API："
echo "  - GET http://$REMOTE_HOST:$REMOTE_PORT/api/health"
echo "  - GET http://$REMOTE_HOST:$REMOTE_PORT/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7" 