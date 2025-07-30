#!/bin/bash

echo "🚀 开始宝塔服务器部署..."

# 设置变量
PROJECT_NAME="finger-detect-backend"
PROJECT_PATH="/www/wwwroot/$PROJECT_NAME"
BACKUP_PATH="/www/backup/$PROJECT_NAME"

# 创建备份目录
mkdir -p $BACKUP_PATH

# 备份当前版本（如果存在）
if [ -d "$PROJECT_PATH" ]; then
    echo "📦 备份当前版本..."
    cp -r $PROJECT_PATH $BACKUP_PATH/$(date +%Y%m%d_%H%M%S)
fi

# 创建项目目录
mkdir -p $PROJECT_PATH

# 复制项目文件
echo "📁 复制项目文件..."
cp -r . $PROJECT_PATH/

# 进入项目目录
cd $PROJECT_PATH

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 生成 Prisma 客户端
echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
npx prisma migrate deploy

# 构建项目
echo "🔨 构建项目..."
npm run build

# 设置权限
echo "🔐 设置文件权限..."
chown -R www:www $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

echo "✅ 部署完成！"
echo "📍 项目路径: $PROJECT_PATH"
echo "🌐 访问地址: http://你的域名:3001" 