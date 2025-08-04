# 修复迁移问题操作指南

## 问题分析
你遇到的错误是因为迁移文件 `20250804111039_redesign_archive_structure` 中的步骤顺序有问题：
- 第12行尝试插入 `status` 字段到 `archives` 表
- 但此时 `archives` 表还没有 `status` 字段（在第25行才添加）

## 解决方案（不删除数据库）

### 方法1: 使用 migrate resolve（推荐）

```bash
# 1. 停止应用服务
pm2 stop all

# 2. 拉取最新代码
git checkout dev
git pull origin dev

# 3. 安装依赖
npm install

# 4. 生成Prisma客户端
npx prisma generate

# 5. 标记有问题的迁移为已应用
npx prisma migrate resolve --applied 20250804111039_redesign_archive_structure

# 6. 验证数据库结构
npx prisma db pull

# 7. 启动服务
pm2 start all
```

### 方法2: 使用 db push 强制同步

如果方法1失败，使用：

```bash
# 1. 停止应用服务
pm2 stop all

# 2. 拉取最新代码
git checkout dev
git pull origin dev

# 3. 安装依赖
npm install

# 4. 生成Prisma客户端
npx prisma generate

# 5. 强制同步数据库结构
npx prisma db push --accept-data-loss

# 6. 验证数据库结构
npx prisma db pull

# 7. 启动服务
pm2 start all
```

### 方法3: 手动修复迁移文件

如果上述方法都不行，可以手动修复迁移文件：

```bash
# 1. 编辑迁移文件
nano prisma/migrations/20250804111039_redesign_archive_structure/migration.sql

# 2. 将第12行的 INSERT 语句移到第25行之后（在添加 status 字段之后）

# 3. 重新应用迁移
npx prisma migrate deploy
```

## 验证步骤

```bash
# 检查迁移状态
npx prisma migrate status

# 查看数据库内容
node scripts/view-db.js

# 测试API
curl http://47.76.126.85:4000/api/health
```

## 常用命令

```bash
# 查看迁移状态
npx prisma migrate status

# 查看数据库结构
npx prisma db pull

# 生成Prisma客户端
npx prisma generate

# 标记迁移为已应用
npx prisma migrate resolve --applied <migration_name>

# 强制同步数据库
npx prisma db push --accept-data-loss
```

## 注意事项

1. **migrate resolve** 会标记迁移为已应用，但不会执行SQL
2. **db push** 会强制同步数据库结构，可能会丢失数据
3. 建议先备份重要数据
4. 如果数据不重要，可以直接使用 `db push` 