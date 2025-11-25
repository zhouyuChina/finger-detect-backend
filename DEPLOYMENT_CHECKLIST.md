# 生产环境部署检查清单

## ⚠️ 部署前准备

### 1. 备份数据库（必须！）
```bash
# PostgreSQL 备份命令
pg_dump -h <host> -U <username> -d finger_detect_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 或使用 pg_dump with custom format
pg_dump -h <host> -U <username> -Fc -d finger_detect_db > backup_$(date +%Y%m%d_%H%M%S).dump
```

### 2. 测试环境验证
- [ ] 在测试环境运行迁移脚本
- [ ] 验证所有功能正常工作
- [ ] 检查数据完整性

## 📋 数据库迁移方案

### 方案 A：使用 Prisma Migrate（推荐）

1. **生成迁移文件**（在开发环境）：
```bash
npx prisma migrate dev --name add_permissions_and_system_settings
```

2. **检查生成的 SQL 文件**：
查看 `prisma/migrations/[timestamp]_add_permissions_and_system_settings/migration.sql`

3. **部署到生产环境**：
```bash
# 上传代码和迁移文件
git push production main

# 在生产服务器上执行
npx prisma migrate deploy
```

### 方案 B：手动 SQL 迁移（更安全）

1. **上传迁移脚本**：
将 `migrations/manual_migration.sql` 上传到生产服务器

2. **连接生产数据库**：
```bash
psql -h <host> -U <username> -d finger_detect_db
```

3. **执行迁移**：
```bash
\i migrations/manual_migration.sql
```

4. **验证结果**：
```sql
-- 检查 permissions 字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admins' AND column_name = 'permissions';

-- 检查 system_settings 表
SELECT * FROM system_settings;

-- 检查管理员权限
SELECT username, role, array_length(permissions, 1) as perm_count
FROM admins;
```

## 🔄 代码部署步骤

### 1. 更新依赖
```bash
npm install recharts
```

### 2. 同步代码文件

#### 新增文件：
- `src/hooks/useSystemSettings.js`
- `src/app/api/dashboard/stats/route.js`
- `src/app/api/settings/system/route.js`
- `migrations/manual_migration.sql`
- `migrations/rollback_migration.sql`

#### 修改的关键文件：
- `prisma/schema.prisma`
- `src/components/layout/AdminLayout.js`
- `src/components/layout/LayoutWrapper.js`
- `src/app/page.js`
- `src/app/dashboard/page.js`
- `src/app/settings/page.js`
- `src/hooks/usePermissions.js`
- `src/lib/middleware.js`
- `src/app/api/auth/login/route.js`
- `src/app/api/admin-management/create/route.js`

### 3. 重新生成 Prisma Client
```bash
npx prisma generate
```

### 4. 重启应用
```bash
pm2 restart finger-detect-backend
# 或
npm run build && npm start
```

## ✅ 部署后验证

### 1. 功能测试清单
- [ ] 登录页面显示正确的系统名称
- [ ] 管理员可以正常登录
- [ ] 仪表盘显示统计数据和图表
- [ ] 权限系统正常工作（测试普通管理员权限）
- [ ] 系统设置可以正常保存和加载
- [ ] 企业信息管理正常工作

### 2. 数据完整性检查
```sql
-- 检查管理员数据
SELECT COUNT(*) FROM admins;

-- 检查权限配置
SELECT username, role, permissions FROM admins;

-- 检查系统设置
SELECT * FROM system_settings;
```

### 3. 性能检查
- [ ] 页面加载速度正常
- [ ] API 响应时间正常
- [ ] 没有内存泄漏或错误日志

## 🚨 如果出现问题

### 立即回滚步骤：

1. **回滚数据库**：
```bash
# 使用回滚脚本
psql -h <host> -U <username> -d finger_detect_db -f migrations/rollback_migration.sql

# 或恢复备份
pg_restore -h <host> -U <username> -d finger_detect_db backup_YYYYMMDD_HHMMSS.dump
```

2. **回滚代码**：
```bash
git revert HEAD
git push production main
```

3. **重启应用**：
```bash
pm2 restart finger-detect-backend
```

## 📊 监控建议

部署后持续监控以下指标：
- 错误日志
- 数据库连接数
- API 响应时间
- 内存使用率
- CPU 使用率

## 🔐 安全注意事项

1. 确保 `.env` 文件包含正确的生产环境变量
2. 检查 DATABASE_URL 连接字符串
3. 确认 JWT_SECRET 已设置
4. 验证所有 API 端点的认证中间件

## 📞 紧急联系

如果遇到严重问题：
1. 立即停止应用
2. 执行回滚
3. 检查日志文件
4. 联系技术支持

---

**重要提醒**：
- ✅ 务必在非高峰时段部署
- ✅ 提前通知用户可能的短暂服务中断
- ✅ 准备好快速回滚方案
- ✅ 保持数据库备份至少 7 天
