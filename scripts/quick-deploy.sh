#!/bin/bash

echo "🚀 指纹检测系统 - 一键部署脚本"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 设置变量
PROJECT_NAME="finger-detect-backend"
PROJECT_PATH="/www/wwwroot/$PROJECT_NAME"
DB_NAME="finger_detect_db"
DB_USER="finger_user"
DB_PASSWORD=$(openssl rand -base64 12)

echo -e "${BLUE}📋 部署信息:${NC}"
echo "  项目名称: $PROJECT_NAME"
echo "  项目路径: $PROJECT_PATH"
echo "  数据库名: $DB_NAME"
echo "  数据库用户: $DB_USER"
echo "  数据库密码: $DB_PASSWORD"
echo ""

# 确认部署
read -p "是否继续部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  部署已取消${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 开始部署...${NC}"

# 1. 检查并安装 Node.js
echo -e "${YELLOW}📦 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"
fi

# 2. 检查并安装 PostgreSQL
echo -e "${YELLOW}🗄️  检查 PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo "安装 PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo -e "${GREEN}✅ PostgreSQL 已安装${NC}"
fi

# 3. 创建数据库和用户
echo -e "${YELLOW}🗄️  配置数据库...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || echo "权限已设置"

# 4. 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# 5. 检查项目文件是否存在
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 项目文件不存在，请先上传项目文件到 $PROJECT_PATH${NC}"
    exit 1
fi

# 6. 安装依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
npm install --production

# 7. 创建环境变量文件
echo -e "${YELLOW}⚙️  配置环境变量...${NC}"
cat > .env << EOF
# 数据库配置
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# JWT 密钥
JWT_SECRET="$(openssl rand -base64 32)"

# 应用配置
NODE_ENV="production"
PORT=3001

# 微信小程序配置（可选）
WECHAT_APP_ID=""
WECHAT_APP_SECRET=""
EOF

# 8. 生成 Prisma 客户端
echo -e "${YELLOW}🗄️  生成 Prisma 客户端...${NC}"
npx prisma generate

# 9. 运行数据库迁移
echo -e "${YELLOW}🔄 运行数据库迁移...${NC}"
npx prisma migrate deploy

# 10. 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

# 11. 安装 PM2
echo -e "${YELLOW}📦 安装 PM2...${NC}"
npm install -g pm2

# 12. 启动应用
echo -e "${YELLOW}🚀 启动应用...${NC}"
pm2 start ecosystem.config.js

# 13. 设置开机自启
echo -e "${YELLOW}⚙️  设置开机自启...${NC}"
pm2 startup
pm2 save

# 14. 初始化数据库数据
echo -e "${YELLOW}📊 初始化数据库数据...${NC}"
npm run baota:init-db

# 15. 设置文件权限
echo -e "${YELLOW}🔐 设置文件权限...${NC}"
chown -R www:www $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${BLUE}📊 部署信息:${NC}"
echo "  项目路径: $PROJECT_PATH"
echo "  数据库名: $DB_NAME"
echo "  数据库用户: $DB_USER"
echo "  数据库密码: $DB_PASSWORD"
echo "  应用端口: 3001"
echo ""
echo -e "${BLUE}🔐 默认账号:${NC}"
echo "  管理员账号: admin"
echo "  管理员密码: admin123"
echo ""
echo -e "${BLUE}📋 后续步骤:${NC}"
echo "  1. 配置 Nginx 反向代理"
echo "  2. 申请 SSL 证书"
echo "  3. 配置防火墙"
echo "  4. 修改默认密码"
echo ""
echo -e "${YELLOW}⚠️  重要提醒:${NC}"
echo "  - 请立即修改管理员密码"
echo "  - 请保存好数据库密码"
echo "  - 请配置 SSL 证书确保安全"
echo ""
echo -e "${GREEN}✅ 部署脚本执行完成！${NC}" 