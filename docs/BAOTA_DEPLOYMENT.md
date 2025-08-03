# 宝塔服务器部署指南

## 📋 前置要求

### 1. 宝塔面板环境
- 宝塔面板 7.x 或更高版本
- Node.js 18.x 或更高版本
- PostgreSQL 数据库
- Nginx 反向代理

### 2. 服务器配置
- 内存：至少 2GB
- 存储：至少 10GB 可用空间
- 操作系统：CentOS 7+ / Ubuntu 18+ / Debian 9+

## 🚀 部署步骤

### 第一步：准备服务器环境

1. **安装 Node.js**
   ```bash
   # 在宝塔面板 -> 软件商店 -> 搜索 Node.js -> 安装
   # 或使用命令行安装
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **安装 PostgreSQL**
   ```bash
   # 在宝塔面板 -> 软件商店 -> 搜索 PostgreSQL -> 安装
   # 或使用命令行安装
   sudo apt-get install postgresql postgresql-contrib
   ```

3. **创建数据库**
   ```sql
   -- 在宝塔面板 -> 数据库 -> 添加数据库
   -- 数据库名：finger_detect_db
   -- 用户名：finger_user
   -- 密码：设置一个强密码
   ```

### 第二步：上传项目文件

1. **创建项目目录**
   ```bash
   mkdir -p /www/wwwroot/finger-detect-backend
   cd /www/wwwroot/finger-detect-backend
   ```

2. **上传项目文件**
   - 方法1：使用宝塔面板文件管理器上传
   - 方法2：使用 Git 克隆
   ```bash
   git clone https://github.com/你的用户名/finger-detect-backend.git .
   ```

### 第三步：配置环境变量

1. **创建环境变量文件**
   ```bash
   cd /www/wwwroot/finger-detect-backend
   nano .env
   ```

2. **添加环境变量**
   ```env
   # 数据库配置
   DATABASE_URL="postgresql://finger_user:你的密码@localhost:5432/finger_detect_db"
   
   # JWT 密钥（生产环境请使用强密钥）
   JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
   
   # 应用配置
   NODE_ENV="production"
   PORT=3001
   
   # 微信小程序配置（可选）
   WECHAT_APP_ID="your-wechat-app-id"
   WECHAT_APP_SECRET="your-wechat-app-secret"
   ```

### 第四步：安装依赖和构建

1. **安装依赖**
   ```bash
   cd /www/wwwroot/finger-detect-backend
   npm install --production
   ```

2. **生成 Prisma 客户端**
   ```bash
   npx prisma generate
   ```

3. **运行数据库迁移**
   ```bash
   npx prisma migrate deploy
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

### 第五步：初始化数据库数据

1. **运行初始化脚本**
   ```bash
   npm run baota:init-db
   ```

   这将创建：
   - 管理员账号：`admin` / 密码：`admin123`
   - 测试用户数据
   - 测试资讯数据
   - 测试档案数据
   - 测试检测记录
   - 测试反馈数据
   - 系统消息
   - 优惠券数据

### 第六步：配置 PM2 进程管理

1. **安装 PM2**
   ```bash
   npm install -g pm2
   ```

2. **启动应用**
   ```bash
   cd /www/wwwroot/finger-detect-backend
   pm2 start ecosystem.config.js
   ```

3. **设置开机自启**
   ```bash
   pm2 startup
   pm2 save
   ```

### 第七步：配置 Nginx 反向代理

1. **在宝塔面板创建网站**
   - 域名：你的域名
   - 根目录：`/www/wwwroot/finger-detect-backend`

2. **配置反向代理**
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. **配置 SSL 证书**
   - 在宝塔面板 -> SSL -> 申请 Let's Encrypt 证书

### 第八步：配置防火墙

1. **开放端口**
   ```bash
   # 在宝塔面板 -> 安全 -> 防火墙
   # 开放端口：80, 443, 3001
   ```

## 🔧 常用管理命令

### PM2 管理
```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart finger-detect-backend

# 停止应用
pm2 stop finger-detect-backend

# 查看日志
pm2 logs finger-detect-backend

# 监控
pm2 monit
```

### 数据库管理
```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma migrate reset

# 重新初始化数据
npm run baota:init-db
```

### 应用管理
```bash
# 更新代码后重启
cd /www/wwwroot/finger-detect-backend
git pull
npm install --production
npm run build
pm2 restart finger-detect-backend

# 查看应用日志
tail -f /www/wwwroot/finger-detect-backend/logs/app.log
```

## 📊 访问地址

- **管理后台**: `https://你的域名`
- **API 接口**: `https://你的域名/api`
- **微信小程序接口**: `https://你的域名/api/miniprogram`

## 🔐 默认账号

- **管理员账号**: `admin`
- **管理员密码**: `admin123`
- **登录地址**: `https://你的域名`

## 🚨 安全注意事项

1. **修改默认密码**
   - 首次登录后立即修改管理员密码
   - 使用强密码策略

2. **数据库安全**
   - 定期备份数据库
   - 限制数据库访问IP
   - 使用强密码

3. **服务器安全**
   - 定期更新系统和软件
   - 配置防火墙规则
   - 监控服务器资源使用

4. **SSL 证书**
   - 确保使用 HTTPS
   - 定期更新 SSL 证书

## 🐛 故障排除

### 常见问题

1. **应用无法启动**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 3001
   
   # 检查日志
   pm2 logs finger-detect-backend
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   sudo systemctl status postgresql
   
   # 检查连接字符串
   echo $DATABASE_URL
   ```

3. **Nginx 配置错误**
   ```bash
   # 检查 Nginx 配置
   nginx -t
   
   # 重启 Nginx
   systemctl restart nginx
   ```

### 获取帮助

- 查看应用日志：`pm2 logs finger-detect-backend`
- 查看 Nginx 日志：`tail -f /var/log/nginx/error.log`
- 查看系统日志：`journalctl -u pm2-root`

## 📈 性能优化

1. **启用 Gzip 压缩**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **配置缓存**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **监控资源使用**
   ```bash
   # 安装监控工具
   pm2 install pm2-server-monit
   ```

## 🔄 更新部署

1. **备份当前版本**
   ```bash
   cp -r /www/wwwroot/finger-detect-backend /www/backup/finger-detect-backend-$(date +%Y%m%d_%H%M%S)
   ```

2. **更新代码**
   ```bash
   cd /www/wwwroot/finger-detect-backend
   git pull origin main
   npm install --production
   npm run build
   ```

3. **重启应用**
   ```bash
   pm2 restart finger-detect-backend
   ```

4. **验证部署**
   - 访问网站确认功能正常
   - 检查日志确认无错误 