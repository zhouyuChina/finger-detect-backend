# 数据库重置指南

## 问题描述

线上环境出现接口500错误，主要原因是：
1. 数据库结构与最新的Prisma schema不匹配
2. 某些表缺少必要的字段（如banner表的position字段）
3. 迁移文件可能没有正确执行

## 解决方案

### 方案一：使用重置脚本（推荐）

#### 1. 生产环境重置
```bash
# 在服务器上执行（从项目根目录）
./scripts/production-reset.sh

# 或者从scripts目录执行
cd scripts && ./production-reset.sh
```

#### 2. 开发环境重置
```bash
# 在本地执行
./scripts/reset-database.sh
```

### 方案二：手动重置

#### 1. 重置数据库
```bash
# 删除所有迁移记录和数据
npx prisma migrate reset --force --skip-seed
```

#### 2. 重新生成客户端
```bash
npx prisma generate
```

#### 3. 推送最新schema
```bash
npx prisma db push
```

## 重置后的验证

### 1. 检查数据库连接
```bash
node -e "
const { PrismaClient } = require('./src/generated/prisma/index.js')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.\$connect()
    console.log('✅ 数据库连接成功')
    
    const tables = ['banner', 'news', 'wechatUser', 'subUser', 'coupon', 'systemReply']
    for (const table of tables) {
      try {
        const count = await prisma[table].count()
        console.log(\`✅ \${table}表查询成功，记录数: \${count}\`)
      } catch (error) {
        console.log(\`❌ \${table}表查询失败: \${error.message}\`)
      }
    }
    
    await prisma.\$disconnect()
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
  }
}

testConnection()
"
```

### 2. 测试关键接口
```bash
# 测试banner接口
curl http://47.76.126.85:4000/api/banners

# 测试news接口
curl http://47.76.126.85:4000/api/news

# 测试coupons接口
curl http://47.76.126.85:4000/api/coupons

# 测试system-replies接口
curl http://47.76.126.85:4000/api/system-replies
```

## 注意事项

### ⚠️ 重要提醒
1. **数据丢失**：重置操作会清空所有现有数据
2. **备份建议**：如果有重要数据，请先备份
3. **服务中断**：重置期间服务可能暂时不可用

### 🔧 重置后的操作
1. 重新创建管理员账号
2. 重新配置系统设置
3. 测试所有关键功能

## 常见问题

### Q: 重置后接口仍然500错误？
A: 检查以下几点：
- 数据库连接配置是否正确
- Prisma客户端是否正确生成
- 服务器是否需要重启

### Q: 如何备份数据？
A: 可以使用以下命令：
```bash
# PostgreSQL备份
pg_dump $DATABASE_URL > backup.sql

# 或者使用Prisma
npx prisma db pull
```

### Q: 重置后需要重新部署吗？
A: 通常不需要，但建议重启应用服务以确保使用最新的数据库结构。

## 更新日志

- **v1.0**: 初始版本，提供数据库重置解决方案
