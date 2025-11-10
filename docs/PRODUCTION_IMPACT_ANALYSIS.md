# 方案B对线上测试数据库的影响分析

## 关键问题

线上测试数据库有数据，方案B会：
1. 将 `archiveId` 从可选改为必填（`String?` → `String`）
2. 添加外键约束

**潜在风险：** 如果线上有 `archiveId = null` 的检测记录，迁移会失败！

## 第一步：检查线上数据

需要先检查线上测试数据库的情况：

```javascript
// 在线上测试环境运行
node scripts/check-archive-id-status.js
```

### 可能的情况

#### 情况A：所有检测记录都有 archiveId ✅
```
总检测记录数: 150
已有 archiveId: 150
缺少 archiveId: 0
覆盖率: 100%
```

**影响：** 无影响，可以安全迁移

#### 情况B：部分检测记录缺少 archiveId ⚠️
```
总检测记录数: 150
已有 archiveId: 80
缺少 archiveId: 70
覆盖率: 53.33%
```

**影响：** 需要先修复数据，再迁移

#### 情况C：所有检测记录都没有 archiveId ❌
```
总检测记录数: 150
已有 archiveId: 0
缺少 archiveId: 150
覆盖率: 0%
```

**影响：** 必须先修复所有数据

---

## 针对不同情况的方案

### 情况A：100%覆盖率（最理想）

**执行步骤：**

1. **在测试环境验证**
   ```bash
   # 1. 修改 Schema
   # 2. 创建迁移
   npx prisma migrate dev --name add_archive_relation
   # 3. 修改代码
   # 4. 测试
   ```

2. **部署到线上**
   ```bash
   # 1. 备份数据库
   pg_dump $PROD_DATABASE_URL > backup.sql

   # 2. 应用迁移（瞬间完成）
   npx prisma migrate deploy

   # 3. 部署代码
   git push
   ```

**影响：** 零影响，迁移时间 < 1秒

---

### 情况B/C：部分或全部缺少 archiveId

**需要数据修复！**

#### 步骤1：运行数据修复脚本（已准备好）

```bash
# 在线上测试环境
# 1. 先 DRY RUN 检查
node scripts/fix-archive-relations.js --dry-run

# 2. 实际修复
node scripts/fix-archive-relations.js
```

这个脚本会：
- 为每条检测记录找到对应的档案
- 根据 `archiveName` + `subUserId` 匹配档案
- 填充 `archiveId`

#### 步骤2：验证修复结果

```bash
# 再次检查
node scripts/check-archive-id-status.js

# 应该看到 100% 覆盖率
```

#### 步骤3：应用 Schema 迁移

```bash
npx prisma migrate deploy
```

---

## 零停机方案（推荐）

为了确保线上服务不中断，采用分阶段部署：

### 阶段1：准备阶段（不影响线上）

1. **检查线上数据**
   ```bash
   node scripts/check-archive-id-status.js
   ```

2. **如果需要，修复数据**
   ```bash
   node scripts/fix-archive-relations.js
   ```

3. **验证数据**
   ```bash
   # 确保 100% 覆盖率
   node scripts/check-archive-id-status.js
   ```

**影响：** 零影响，只是填充数据

---

### 阶段2：Schema 迁移（快速，< 1秒）

```bash
# 应用迁移
npx prisma migrate deploy
```

**SQL操作：**
```sql
-- 1. 设置 NOT NULL（如果所有记录都有值，瞬间完成）
ALTER TABLE detections ALTER COLUMN "archiveId" SET NOT NULL;

-- 2. 添加外键（创建约束）
ALTER TABLE detections ADD CONSTRAINT detections_archiveId_fkey
  FOREIGN KEY ("archiveId") REFERENCES archives(id) ON DELETE CASCADE;

-- 3. 添加索引
CREATE INDEX detections_archiveId_idx ON detections("archiveId");
```

**影响：**
- 迁移时间：< 1秒（数据量小）
- 锁表时间：极短
- 服务中断：无（或不到1秒）

---

### 阶段3：代码部署（正常部署）

```bash
git push origin main
# 或 pm2 reload
```

**影响：** 正常部署流程

---

## 可能遇到的问题和解决方案

### 问题1：修复脚本报告有失败记录

**原因：** 检测记录对应的档案已被删除

**解决：**
```javascript
// 删除孤立的检测记录
await prisma.detection.deleteMany({
  where: {
    id: { in: failedDetectionIds }
  }
})
```

---

### 问题2：迁移失败 - 仍有 NULL 值

**原因：** 数据修复不完整

**解决：**
```bash
# 查找所有 NULL 的记录
node -e "
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
const nullRecords = await prisma.detection.findMany({
  where: { archiveId: null },
  select: { id: true, archiveName: true, subUserId: true }
});
console.log(nullRecords);
await prisma.\$disconnect();
"

# 手动修复或删除
```

---

### 问题3：外键约束冲突

**原因：** 有检测记录的 archiveId 指向不存在的档案

**解决：**
```sql
-- 查找无效的 archiveId
SELECT d.id, d.archiveId
FROM detections d
LEFT JOIN archives a ON d.archiveId = a.id
WHERE d.archiveId IS NOT NULL AND a.id IS NULL;

-- 删除或修复这些记录
```

---

## 保险方案：分两次部署

如果担心风险，可以分两次部署：

### 第一次部署：只改代码，不改 Schema

1. 修改所有代码，从 `archiveName` 改为 `archiveId`
2. 部署到线上
3. 观察1-2天，确保功能正常

**优点：**
- 风险更低
- 可以先验证代码逻辑

**缺点：**
- 没有外键保护
- 需要两次部署

### 第二次部署：添加 Schema 约束

1. 应用 Schema 迁移
2. 享受外键保护和自动级联删除

---

## 建议执行方案

**推荐：零停机方案**

```bash
# === 阶段1：准备（可以在任何时候执行）===
# 1. 检查数据
node scripts/check-archive-id-status.js

# 2. 如果需要，修复数据
node scripts/fix-archive-relations.js

# 3. 验证
node scripts/check-archive-id-status.js  # 确保 100%

# === 阶段2：低峰期执行（< 1分钟）===
# 1. 备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. 应用迁移（< 1秒）
npx prisma migrate deploy

# 3. 部署代码
git push origin main

# 4. 验证服务正常
curl https://your-domain.com/api/health
```

**总停机时间：** 0秒（或不到1秒的锁表时间）

---

## 回滚方案

如果出现问题：

```bash
# 1. 回滚代码
git revert <commit>
git push

# 2. 回滚数据库（如果必要）
psql $DATABASE_URL < backup_YYYYMMDD.sql

# 3. 回滚迁移
npx prisma migrate resolve --rolled-back add_archive_relation
```

---

## 总结

**方案B对线上的影响取决于数据情况：**

| 线上数据情况 | 影响 | 处理方式 |
|-------------|------|---------|
| archiveId 100%覆盖 | 零影响 | 直接迁移 |
| archiveId 部分缺失 | 需要先修复数据 | 运行修复脚本 → 迁移 |
| archiveId 全部缺失 | 需要先修复数据 | 运行修复脚本 → 迁移 |

**下一步：**
1. 先在线上测试环境运行 `check-archive-id-status.js`
2. 根据结果决定是否需要数据修复
3. 执行零停机方案

要我帮你先检查线上数据情况吗？或者你可以自己先在线上运行检查脚本看看。
