# 手动清空数据库并重新初始化操作指南

## 概述
本指南将帮助你在远程服务器上完全清空数据库并重新初始化，确保没有脏数据。

## ⚠️ 重要提醒
- **此操作会删除所有现有数据**
- **请确保已备份重要数据**
- **建议在维护时间执行**

## 操作步骤

### 1. 连接到远程服务器
```bash
ssh root@47.76.126.85
```

### 2. 进入项目目录
```bash
cd /www/wwwroot/finger-detect-backend
```

### 3. 备份当前数据库（可选）
```bash
# 创建备份目录
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker exec finger-detect-postgres pg_dump -U postgres finger_detect_db > backups/$(date +%Y%m%d_%H%M%S)/backup.sql

echo "✅ 数据库已备份到 backups/$(date +%Y%m%d_%H%M%S)/backup.sql"
```

### 4. 停止应用服务
```bash
# 停止PM2服务
pm2 stop all

# 确认服务已停止
pm2 status
```

### 5. 清空数据库
```bash
# 连接到PostgreSQL容器
docker exec -it finger-detect-postgres psql -U postgres

# 在PostgreSQL中执行以下命令：
# 1. 删除数据库
DROP DATABASE IF EXISTS finger_detect_db;

# 2. 重新创建数据库
CREATE DATABASE finger_detect_db;

# 3. 退出PostgreSQL
\q
```

### 6. 拉取最新代码
```bash
# 确保在正确的分支
git checkout dev

# 拉取最新代码
git pull origin dev

# 查看当前提交
git log --oneline -5
```

### 7. 安装依赖
```bash
# 安装Node.js依赖
npm install

# 生成Prisma客户端
npx prisma generate
```

### 8. 重置Prisma迁移历史
```bash
# 重置迁移历史（这会删除所有迁移记录）
npx prisma migrate reset --force

# 或者，如果你想保留迁移文件但重新应用：
# npx prisma db push --force-reset
```

### 9. 应用所有迁移
```bash
# 应用所有迁移文件
npx prisma migrate deploy

# 验证数据库结构
npx prisma db pull
```

### 10. 创建初始数据
```bash
# 创建基础测试数据
node scripts/init-db.js

# 或者创建完整的生产数据
# node scripts/init-production-db.js
```

### 11. 验证数据
```bash
# 查看数据库内容
node scripts/view-db.js

# 检查用户数据
node scripts/check-users.js
```

### 12. 重启应用服务
```bash
# 启动PM2服务
pm2 start all

# 查看服务状态
pm2 status

# 查看日志
pm2 logs
```

### 13. 测试API
```bash
# 测试健康检查
curl http://47.76.126.85:4000/api/health

# 测试档案API（需要先创建测试用户）
curl http://47.76.126.85:4000/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7
```

## 故障排除

### 如果迁移失败
```bash
# 检查迁移状态
npx prisma migrate status

# 如果有问题，可以强制重置
npx prisma migrate reset --force

# 然后重新应用迁移
npx prisma migrate deploy
```

### 如果数据库连接失败
```bash
# 检查PostgreSQL容器状态
docker ps | grep postgres

# 重启PostgreSQL容器
docker restart finger-detect-postgres

# 等待几秒后重试
sleep 5
```

### 如果PM2服务启动失败
```bash
# 查看PM2日志
pm2 logs

# 删除PM2进程
pm2 delete all

# 重新启动
pm2 start ecosystem.config.js
```

## 验证清单

- [ ] 数据库已清空并重新创建
- [ ] 所有迁移已成功应用
- [ ] 初始数据已创建
- [ ] 应用服务正常运行
- [ ] API接口响应正常
- [ ] 数据库结构符合预期

## 常用命令速查

```bash
# 查看数据库状态
npx prisma migrate status

# 查看数据库内容
node scripts/view-db.js

# 查看应用日志
pm2 logs

# 重启应用
pm2 restart all

# 查看服务状态
pm2 status
```

## 联系信息
如果遇到问题，请检查：
1. 数据库连接配置
2. 迁移文件完整性
3. 应用日志错误信息
4. 网络连接状态 