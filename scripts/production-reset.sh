#!/bin/bash

# 获取脚本所在目录的上级目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚨 生产环境数据库重置脚本"
echo "⚠️  此操作将清空所有数据！"
echo "请确认您要执行此操作 (y/N):"
read -r confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo "🔧 开始重置生产环境数据库..."
echo "📁 切换到项目根目录: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# 1. 重置数据库（删除所有表和数据）
echo "🗑️  清空数据库..."
npx prisma migrate reset --force --skip-seed

# 2. 重新生成客户端
echo "🔨 重新生成Prisma客户端..."
npx prisma generate

# 3. 推送最新schema
echo "📤 推送数据库结构..."
npx prisma db push

echo "✅ 数据库重置完成！"
echo "🔍 请测试以下接口确保正常工作："
echo "  - GET /api/banners"
echo "  - GET /api/news"
echo "  - GET /api/coupons"
echo "  - GET /api/system-replies"
