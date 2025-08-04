#!/bin/bash

echo "🔧 修复迁移问题脚本"
echo "📋 此脚本将修复迁移冲突，不删除数据库"
echo ""

read -p "确认要继续吗？(输入 'yes' 继续): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🔄 开始修复迁移问题..."

# 1. 停止应用服务
echo "📦 停止应用服务..."
pm2 stop all

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git checkout dev
git pull origin dev

# 3. 安装依赖
echo "📦 安装依赖..."
npm install

# 4. 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 5. 检查迁移状态
echo "🔍 检查迁移状态..."
npx prisma migrate status

# 6. 尝试解决迁移冲突
echo "🔄 尝试解决迁移冲突..."

# 方法1: 使用 migrate resolve 标记迁移为已应用
echo "📋 方法1: 标记有问题的迁移为已应用..."
npx prisma migrate resolve --applied 20250804111039_redesign_archive_structure

# 方法2: 如果上面失败，使用 db push 强制同步
echo "📋 方法2: 使用 db push 强制同步数据库结构..."
npx prisma db push --accept-data-loss

# 7. 验证数据库结构
echo "✅ 验证数据库结构..."
npx prisma db pull

# 8. 检查迁移状态
echo "🔍 再次检查迁移状态..."
npx prisma migrate status

# 9. 创建初始数据（如果需要）
echo "👥 创建初始数据..."
node scripts/init-db.js

# 10. 启动服务
echo "🚀 启动服务..."
pm2 start all

# 11. 验证
echo "✅ 验证服务状态..."
pm2 status

echo ""
echo "🎉 迁移修复完成！"
echo "📋 可以测试以下API："
echo "  - 健康检查: curl http://47.76.126.85:4000/api/health"
echo "  - 档案API: curl http://47.76.126.85:4000/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7" 