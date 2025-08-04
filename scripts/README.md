# Scripts 目录说明

## 核心功能脚本

### 数据库管理
- **init-db.js** - 初始化本地数据库，创建基础表结构和测试数据
- **init-production-db.js** - 初始化生产环境数据库，包含完整的种子数据
- **view-db.js** - 查看数据库内容，显示用户、档案、检测记录等信息
- **check-users.js** - 检查用户数据，显示微信用户和子用户信息

### 数据种子脚本
- **seed-banners.js** - 创建轮播图测试数据
- **seed-news.js** - 创建新闻资讯测试数据
- **seed-user-hierarchy.js** - 创建用户层级测试数据
- **create-remote-test-data.js** - 为远程服务器创建测试数据

### 部署脚本
- **deploy.js** - 基础部署脚本
- **quick-deploy.sh** - 快速部署脚本（包含完整流程）
- **baota-deploy.sh** - 宝塔面板部署脚本

## 使用说明

### 本地开发
```bash
# 初始化本地数据库
node scripts/init-db.js

# 查看数据库内容
node scripts/view-db.js

# 检查用户数据
node scripts/check-users.js
```

### 远程部署
```bash
# 快速部署
bash scripts/quick-deploy.sh

# 手动操作请参考 docs/MANUAL_DATABASE_RESET.md
```

### 创建测试数据
```bash
# 创建轮播图数据
node scripts/seed-banners.js

# 创建新闻数据
node scripts/seed-news.js

# 创建用户层级数据
node scripts/seed-user-hierarchy.js

# 创建远程测试数据
node scripts/create-remote-test-data.js
```

## 注意事项

1. **数据库脚本**：运行前请确保数据库连接正常
2. **远程脚本**：需要SSH访问权限
3. **测试数据**：仅用于开发和测试环境
4. **备份**：重要操作前建议备份数据库 