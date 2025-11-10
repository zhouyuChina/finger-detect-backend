# Archive-Detection 关联关系修复执行手册

## 快速开始

**问题：** 当前系统通过 `archiveName` 关联档案和检测记录，修改档案名后会导致历史记录丢失。

**解决方案：** 改用不可变的 `archiveId` 建立外键关系。

**预计时间：** 10-15 小时（包括测试）

---

## 执行前准备

### 1. 环境要求

- [ ] Node.js v20.17.0+
- [ ] PostgreSQL 数据库
- [ ] 测试环境（与生产环境隔离）
- [ ] 数据库备份工具

### 2. 文档准备

确保已阅读以下文档：

- [ ] [docs/ARCHIVE_NAME_FIX_PLAN.md](./ARCHIVE_NAME_FIX_PLAN.md) - 完整修复方案
- [ ] [docs/CODE_CHANGES_CHECKLIST.md](./CODE_CHANGES_CHECKLIST.md) - 代码修改清单

### 3. 备份检查

```bash
# 检查是否有 pg_dump 工具
which pg_dump

# 测试备份（需要几分钟）
pg_dump $DATABASE_URL > test_backup.sql

# 检查备份文件大小
ls -lh test_backup.sql

# 删除测试备份
rm test_backup.sql
```

---

## 执行步骤

### 阶段 1：准备阶段（1-2 小时）

#### 步骤 1.1：创建测试环境

```bash
# 1. 备份生产数据库
pg_dump $DATABASE_URL > production_backup_$(date +%Y%m%d).sql

# 2. 创建测试数据库
createdb finger_detect_test

# 3. 恢复数据到测试数据库
psql finger_detect_test < production_backup_$(date +%Y%m%d).sql

# 4. 设置测试环境变量
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/finger_detect_test"
```

#### 步骤 1.2：代码审查

```bash
# 查看所有使用 archiveName 的位置
grep -rn "archiveName" src/app/api --include="*.js" | wc -l

# 应该看到约 100+ 行结果
```

---

### 阶段 2：测试环境修复（4-6 小时）

#### 步骤 2.1：运行数据修复脚本（DRY RUN）

```bash
# 先以 DRY RUN 模式运行，只检查不修改
node scripts/fix-archive-relations.js --dry-run --verbose

# 预期输出：
# ✅ 统计信息
# ✅ 需要修复的记录数
# ✅ 预期修复结果
```

#### 步骤 2.2：实际修复数据

```bash
# 实际修复数据
node scripts/fix-archive-relations.js --verbose

# 检查输出：
# - 成功修复了多少条记录
# - 是否有失败的记录
# - 如果有失败记录，检查 failed_detections_*.json 文件
```

**如果有失败记录：**

```bash
# 查看失败记录
cat failed_detections_*.json

# 分析失败原因：
# 1. 档案已被删除 -> 可以删除这些孤立的检测记录
# 2. 档案名不匹配 -> 需要手动修复
```

#### 步骤 2.3：修改 Schema

```bash
# 1. 编辑 prisma/schema.prisma
# 按照 docs/ARCHIVE_NAME_FIX_PLAN.md 中的 Schema 修改方案修改

# 2. 创建迁移
npx prisma migrate dev --name fix_archive_detection_relation

# 3. 检查迁移 SQL
cat prisma/migrations/*/migration.sql

# 应该包含：
# - ALTER TABLE detections 修改 archiveId 为 NOT NULL
# - ADD CONSTRAINT 添加外键约束
# - CREATE INDEX 添加索引
```

#### 步骤 2.4：修改代码

按照 [docs/CODE_CHANGES_CHECKLIST.md](./CODE_CHANGES_CHECKLIST.md) 逐个修改文件。

**优先修改核心文件：**

1. ✅ src/app/api/miniprogram/detection/route.js
2. ✅ src/app/api/miniprogram/archive-detections/route.js
3. ✅ src/app/api/miniprogram/archives/[id]/route.js
4. ✅ src/app/api/detections/route.js
5. ✅ src/app/api/archives/[id]/route.js

**修改后检查：**

```bash
# 搜索是否还有遗漏的 archiveName 使用
grep -rn "archiveName.*where\|where.*archiveName" src/app/api --include="*.js"

# 搜索是否还有 subUserId_archiveName 使用
grep -rn "subUserId_archiveName" src/app/api --include="*.js"
```

#### 步骤 2.5：测试修改

```bash
# 1. 启动测试服务器
npm run dev

# 2. 手动测试以下功能：
```

**测试用例：**

- [ ] 创建新档案
- [ ] 为档案添加检测记录
- [ ] 修改档案名称
- [ ] 再次查询检测记录（应该能正常显示）
- [ ] 查看档案详情
- [ ] 删除档案（检测记录应该级联删除）
- [ ] 导出档案图片

**使用 Postman 或 curl 测试：**

```bash
# 测试创建检测记录
curl -X POST http://localhost:3000/api/miniprogram/detection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subUserId": "SUB_USER_ID",
    "archiveId": "ARCHIVE_ID",
    "detectionType": "left_hand_thumb",
    "imageUrl": "https://example.com/image.jpg"
  }'

# 测试查询档案检测记录
curl -X GET "http://localhost:3000/api/miniprogram/archive-detections?archiveId=ARCHIVE_ID&subUserId=SUB_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试修改档案名称
curl -X PUT http://localhost:3000/api/miniprogram/archives/ARCHIVE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "archiveName": "新的档案名称",
    "bodyPart": "left_hand_thumb"
  }'

# 再次查询检测记录（验证关联没有丢失）
curl -X GET "http://localhost:3000/api/miniprogram/archive-detections?archiveId=ARCHIVE_ID&subUserId=SUB_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 步骤 2.6：数据验证

```bash
# 运行验证脚本
node scripts/fix-archive-relations.js --dry-run

# 预期结果：
# ✅ 所有检测记录都有 archiveId
# ✅ 数据一致性检查通过
```

---

### 阶段 3：代码审查和优化（2-3 小时）

#### 步骤 3.1：代码审查

- [ ] 所有文件都已修改
- [ ] 没有遗漏的 `archiveName` 查询
- [ ] 删除了 `subUserId_archiveName` 复合键的使用
- [ ] 利用了 Prisma 关系查询（可选但推荐）

#### 步骤 3.2：性能测试

```bash
# 测试查询性能（修改前 vs 修改后）
# 使用数据库查询分析工具
```

#### 步骤 3.3：提交代码

```bash
# 1. 查看所有修改
git status

# 2. 添加修改
git add .

# 3. 提交
git commit -m "fix: 修复 Archive-Detection 关联关系，使用 archiveId 替代 archiveName

- 修改 Schema，添加 Archive-Detection 外键关系
- 将所有 archiveName 查询改为 archiveId 查询
- 简化代码，利用 Prisma 关系查询
- 添加数据修复脚本

相关文档：
- docs/ARCHIVE_NAME_FIX_PLAN.md
- docs/CODE_CHANGES_CHECKLIST.md

🤖 Generated with Claude Code"

# 4. 推送到测试分支
git push origin feature/fix-archive-relations
```

---

### 阶段 4：生产环境部署（1-2 小时）

**⚠️  重要：** 选择低峰期执行！

#### 步骤 4.1：最终准备

```bash
# 1. 确认测试环境一切正常
# 2. 准备回滚方案
# 3. 通知相关人员
```

#### 步骤 4.2：数据备份

```bash
# 生产数据库完整备份
pg_dump $DATABASE_URL > production_backup_final_$(date +%Y%m%d_%H%M%S).sql

# 验证备份
ls -lh production_backup_final_*.sql

# 上传备份到安全位置（如 S3）
# aws s3 cp production_backup_final_*.sql s3://your-backup-bucket/
```

#### 步骤 4.3：执行修复

```bash
# 1. 停止应用服务器（可选，取决于是否需要维护窗口）
pm2 stop all

# 2. 运行数据修复脚本
node scripts/fix-archive-relations.js --verbose

# 3. 检查修复结果
# - 确保成功率 > 99%
# - 如果有失败记录，检查原因

# 4. 应用 Schema 迁移
npx prisma migrate deploy

# 5. 部署新代码
git pull origin main
npm install
npm run build

# 6. 重新生成 Prisma Client
npx prisma generate

# 7. 启动应用服务器
pm2 start all
```

#### 步骤 4.4：验证部署

```bash
# 1. 健康检查
curl http://localhost:3000/api/health

# 2. 快速功能测试（使用生产环境 API）
# 测试关键流程：创建档案、添加检测、修改档案名、查询检测

# 3. 检查日志
pm2 logs

# 4. 监控错误率
# 使用监控工具（如 Sentry、DataDog）
```

#### 步骤 4.5：数据验证

```bash
# 连接到生产数据库验证
node -e "
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

const total = await prisma.detection.count();
const withArchiveId = await prisma.detection.count({
  where: { archiveId: { not: null } }
});

console.log('总检测记录:', total);
console.log('有 archiveId:', withArchiveId);
console.log('覆盖率:', (withArchiveId / total * 100).toFixed(2) + '%');

await prisma.\$disconnect();
"
```

---

## 回滚计划

如果出现问题，立即回滚：

### 快速回滚步骤

```bash
# 1. 停止应用
pm2 stop all

# 2. 回滚代码
git revert HEAD
git push origin main

# 3. 恢复数据库备份
psql $DATABASE_URL < production_backup_final_YYYYMMDD_HHMMSS.sql

# 4. 重新部署旧版本
npm install
npm run build
npx prisma generate

# 5. 启动应用
pm2 start all

# 6. 验证
curl http://localhost:3000/api/health
```

---

## 监控和维护

### 部署后 24 小时监控

- [ ] 错误日志（每小时检查）
- [ ] API 响应时间
- [ ] 数据库查询性能
- [ ] 用户反馈

### 部署后 1 周监控

- [ ] 数据一致性检查
- [ ] 性能对比
- [ ] 用户体验反馈

### 清理工作（1个月后）

如果系统运行稳定，可以考虑：

```prisma
// 删除废弃的 archiveName 字段
model Detection {
  // archiveName String? // 删除这行
}
```

---

## 常见问题

### Q1: 修复脚本报告有失败记录怎么办？

**A:** 查看 `failed_detections_*.json` 文件，分析失败原因：

1. **档案已删除** -> 删除这些孤立的检测记录
2. **档案名不匹配** -> 手动修复或创建对应档案

### Q2: 迁移时报外键约束错误？

**A:** 说明还有检测记录缺少 `archiveId`，重新运行数据修复脚本。

### Q3: 性能下降了怎么办？

**A:** 检查索引是否正确创建：

```sql
-- 查看索引
SELECT * FROM pg_indexes WHERE tablename = 'detections';

-- 应该包含 archiveId 索引
```

### Q4: 如何验证修改是否成功？

**A:** 执行以下测试：

1. 创建新档案
2. 添加检测记录
3. 修改档案名称
4. 查询检测记录，应该能正常显示
5. 检查数据库，`archiveId` 应该没有改变

---

## 检查清单

### 执行前

- [ ] 已阅读完整修复方案
- [ ] 已在测试环境完整测试
- [ ] 已完成数据备份
- [ ] 已准备回滚方案
- [ ] 已选择低峰期执行
- [ ] 已通知相关人员

### 执行中

- [ ] 数据修复脚本执行成功
- [ ] Schema 迁移应用成功
- [ ] 代码部署成功
- [ ] 应用启动正常
- [ ] 健康检查通过

### 执行后

- [ ] 功能测试通过
- [ ] 数据验证通过
- [ ] 性能正常
- [ ] 无错误日志
- [ ] 用户反馈正常

---

## 联系支持

如果在执行过程中遇到问题：

1. 检查日志文件
2. 查看错误信息
3. 参考本文档的常见问题部分
4. 如果无法解决，立即执行回滚

---

**最后提醒：**

- ⚠️  务必在测试环境完整验证后再部署到生产环境
- ⚠️  务必做好数据备份
- ⚠️  务必准备好回滚方案
- ⚠️  务必在低峰期执行

祝部署顺利！🚀
