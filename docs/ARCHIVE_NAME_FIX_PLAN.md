# Archive-Detection 关联关系修复方案

## 问题概述

当前系统存在严重的数据完整性问题：`Detection` 表通过 `archiveName`（可变字段）关联 `Archive` 表，而不是使用不可变的 `archiveId`。

### 问题影响

1. **数据丢失风险**：修改档案名称后，所有历史检测记录将无法正确关联
2. **数据完整性无保证**：缺少外键约束，无法保证引用完整性
3. **性能问题**：使用字符串匹配查询，性能低于 ID 查询
4. **业务逻辑错误**：统计数据可能不准确

### 当前 Schema 问题

```prisma
model Detection {
  id            String   @id @default(cuid())
  archiveName   String   // ❌ 使用可变的名称
  archiveId     String?  // ⚠️ ID 存在但可选，且无外键关系
  subUserId     String
  subUser       SubUser  @relation(fields: [subUserId], references: [id], onDelete: Cascade)
  // ❌ 缺少与 Archive 的外键关系
}

model Archive {
  id          String   @id @default(cuid())
  archiveName String
  subUserId   String
  subUser     SubUser  @relation(fields: [subUserId], references: [id], onDelete: Cascade)
  // ❌ 缺少 detections 反向关系

  @@unique([subUserId, archiveName])
}
```

---

## 修复方案

### 1. Schema 修改

**修改后的 Schema：**

```prisma
model Detection {
  id            String   @id @default(cuid())
  imageUrl      String
  result        String
  confidence    Float
  status        String   @default("pending")
  errorMsg      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  detectionTime DateTime @default(now())
  detectionType String   @default("left_hand_thumb")
  remark        String?
  isFirstReport Boolean  @default(false)

  // ✅ 修改：archiveId 改为必填，添加外键关系
  archiveId     String
  archive       Archive  @relation(fields: [archiveId], references: [id], onDelete: Cascade)

  // ⚠️ 保留 archiveName 用于向后兼容（可在后续版本删除）
  archiveName   String?  // 改为可选，标记为废弃

  subUserId     String
  subUser       SubUser  @relation(fields: [subUserId], references: [id], onDelete: Cascade)

  @@index([archiveId])  // 添加索引提升查询性能
  @@map("detections")
}

model Archive {
  id            String   @id @default(cuid())
  archiveName   String
  activity      String   @default("active")
  photoCount    Int      @default(0)
  bodyPart      String   @default("left_hand_thumb")
  detectionTime DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  subUserId     String
  subUser       SubUser  @relation(fields: [subUserId], references: [id], onDelete: Cascade)

  // ✅ 添加反向关系
  detections    Detection[]

  @@unique([subUserId, archiveName])
  @@map("archives")
}
```

**Schema 变更说明：**

1. ✅ `Detection.archiveId` 从可选改为必填
2. ✅ 添加外键关系 `archive Archive @relation(...)`
3. ✅ 添加索引 `@@index([archiveId])`
4. ✅ `Archive` 添加反向关系 `detections Detection[]`
5. ⚠️ `archiveName` 保留为可选字段（用于向后兼容，后续可删除）

---

### 2. 数据迁移策略

#### 阶段 1：数据修复（修复现有数据的 archiveId）

创建迁移脚本修复现有数据：

```sql
-- Step 1: 为所有 Detection 记录填充 archiveId
UPDATE detections d
SET "archiveId" = a.id
FROM archives a
WHERE d."subUserId" = a."subUserId"
  AND d."archiveName" = a."archiveName"
  AND d."archiveId" IS NULL;

-- Step 2: 检查是否有无法匹配的记录
SELECT
  id,
  "archiveName",
  "subUserId",
  "createdAt"
FROM detections
WHERE "archiveId" IS NULL;

-- Step 3: 如果有无法匹配的记录，需要手动处理或删除
-- （谨慎操作，先备份数据）
```

#### 阶段 2：Schema 迁移

```bash
# 1. 备份当前数据库
pg_dump $DATABASE_URL > backup_before_archive_fix_$(date +%Y%m%d_%H%M%S).sql

# 2. 创建 Prisma 迁移
npx prisma migrate dev --name fix_archive_detection_relation

# 3. 应用迁移
npx prisma migrate deploy
```

---

### 3. 代码修改清单

需要修改以下 18 个文件：

#### 核心修改文件（优先级：高）

1. **src/app/api/miniprogram/detection/route.js**
   - 第 451 行：`archiveName: existingArchive.archiveName` → `archiveId: archiveId`
   - 第 535 行：`archiveName: archive.archiveName` → `archiveId: archiveId`
   - 第 474-477 行：删除使用 `subUserId_archiveName` 复合键的代码

2. **src/app/api/miniprogram/archive-detections/route.js**
   - 第 97 行：`archiveName: archive.archiveName` → `archiveId: archiveId`
   - 第 120 行：`archiveName: archive.archiveName` → `archiveId: archiveId`

3. **src/app/api/miniprogram/archives/[id]/route.js**
   - 第 44 行：`archiveName: archive.archiveName` → `archiveId: archive.id`
   - 第 224 行：`archiveName: archive.archiveName` → `archiveId: archive.id`

4. **src/app/api/archives/[id]/route.js**
   - 删除档案时，通过外键级联删除检测记录（无需手动删除）

5. **src/app/api/detections/route.js**
   - 第 42 行：查询条件从 `archiveName` 改为 `archiveId`

#### 次要修改文件（优先级：中）

6. **src/app/api/miniprogram/detection-real/route.js**
7. **src/app/api/miniprogram/detection-fixed/route.js**
8. **src/app/api/miniprogram/archives/route.js**
9. **src/app/api/miniprogram/photo-record/route.js**
10. **src/app/api/miniprogram/all-archives/route.js**
11. **src/app/api/archives/route.js**
12. **src/app/api/archives/export-images/route.js**
13. **src/app/api/archives/export-all-images/route.js**
14. **src/app/api/detections/[id]/route.js**
15. **src/app/api/detections/export/route.js**

#### 调试和文档文件（优先级：低）

16. **src/app/api/debug-export/route.js**
17. **src/app/api/miniprogram/debug/route.js**
18. **src/app/api/miniprogram/README.md** - 更新文档

---

### 4. 代码修改示例

#### 修改前（错误）

```javascript
// ❌ 使用 archiveName 查询
const detections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: archive.archiveName  // 使用可变字段
  }
})

// ❌ 创建检测记录时使用 archiveName
const newDetection = await prisma.detection.create({
  data: {
    subUserId: subUser.id,
    archiveName: archive.archiveName,  // 使用可变字段
    detectionType,
    imageUrl,
    result,
    confidence
  }
})
```

#### 修改后（正确）

```javascript
// ✅ 使用 archiveId 查询
const detections = await prisma.detection.findMany({
  where: {
    archiveId: archive.id  // 使用不可变 ID
  },
  include: {
    archive: {
      select: {
        archiveName: true,
        bodyPart: true
      }
    }
  }
})

// ✅ 创建检测记录时使用 archiveId
const newDetection = await prisma.detection.create({
  data: {
    archiveId: archive.id,  // 使用不可变 ID
    detectionType,
    imageUrl,
    result,
    confidence
  }
})
```

#### 利用 Prisma 关系查询

```javascript
// ✅ 利用 Prisma 的关系功能
const archive = await prisma.archive.findUnique({
  where: { id: archiveId },
  include: {
    detections: {
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
})

// 直接访问 archive.detections，无需单独查询
console.log('检测记录数:', archive.detections.length)
```

---

### 5. 特殊处理：复合键查询

**问题代码：**

```javascript
// ❌ 当前使用复合键 subUserId_archiveName
archive = await prisma.archive.update({
  where: {
    subUserId_archiveName: {
      subUserId: subUser.id,
      archiveName: existingArchive.archiveName
    }
  },
  data: { /* ... */ }
})
```

**修复方案：**

```javascript
// ✅ 直接使用 ID
archive = await prisma.archive.update({
  where: { id: archiveId },
  data: { /* ... */ }
})
```

---

### 6. 数据修复脚本

创建 `scripts/fix-archive-relations.js`：

```javascript
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function fixArchiveRelations() {
  console.log('开始修复 Archive-Detection 关联关系...')

  try {
    // 1. 统计需要修复的记录
    const detectionsMissingArchiveId = await prisma.detection.count({
      where: { archiveId: null }
    })

    console.log(`发现 ${detectionsMissingArchiveId} 条检测记录缺少 archiveId`)

    if (detectionsMissingArchiveId === 0) {
      console.log('✅ 所有检测记录都已有 archiveId，无需修复')
      return
    }

    // 2. 获取所有需要修复的检测记录
    const detections = await prisma.detection.findMany({
      where: { archiveId: null },
      select: {
        id: true,
        archiveName: true,
        subUserId: true
      }
    })

    let successCount = 0
    let failCount = 0
    const failedRecords = []

    // 3. 逐条修复
    for (const detection of detections) {
      try {
        // 查找对应的档案
        const archive = await prisma.archive.findFirst({
          where: {
            archiveName: detection.archiveName,
            subUserId: detection.subUserId
          }
        })

        if (archive) {
          // 更新检测记录的 archiveId
          await prisma.detection.update({
            where: { id: detection.id },
            data: { archiveId: archive.id }
          })
          successCount++

          if (successCount % 100 === 0) {
            console.log(`已修复 ${successCount} 条记录...`)
          }
        } else {
          // 找不到对应的档案
          failCount++
          failedRecords.push({
            detectionId: detection.id,
            archiveName: detection.archiveName,
            subUserId: detection.subUserId
          })
        }
      } catch (error) {
        console.error(`修复记录 ${detection.id} 失败:`, error.message)
        failCount++
        failedRecords.push({
          detectionId: detection.id,
          error: error.message
        })
      }
    }

    // 4. 输出结果
    console.log('\n修复完成！')
    console.log(`✅ 成功: ${successCount} 条`)
    console.log(`❌ 失败: ${failCount} 条`)

    if (failedRecords.length > 0) {
      console.log('\n失败的记录：')
      console.log(JSON.stringify(failedRecords, null, 2))

      // 保存失败记录到文件
      const fs = await import('fs/promises')
      await fs.writeFile(
        'failed_detections.json',
        JSON.stringify(failedRecords, null, 2)
      )
      console.log('\n失败记录已保存到 failed_detections.json')
    }

  } catch (error) {
    console.error('修复过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行修复
fixArchiveRelations()
  .then(() => {
    console.log('\n✅ 修复脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 修复脚本执行失败:', error)
    process.exit(1)
  })
```

---

### 7. 执行步骤

#### 准备阶段

1. **代码审查**
   ```bash
   # 审查所有使用 archiveName 的位置
   grep -rn "archiveName" src/app/api --include="*.js"
   ```

2. **数据备份**
   ```bash
   # 备份生产数据库
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

   # 验证备份
   ls -lh backup_*.sql
   ```

3. **创建测试环境**
   ```bash
   # 复制生产数据到测试环境
   # 在测试环境执行所有后续步骤
   ```

#### 执行阶段

**步骤 1：运行数据修复脚本**
```bash
node scripts/fix-archive-relations.js
```

**步骤 2：验证数据**
```bash
# 检查是否还有未关联的记录
node -e "
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
const count = await prisma.detection.count({ where: { archiveId: null } });
console.log('未关联的检测记录数:', count);
await prisma.\$disconnect();
"
```

**步骤 3：修改 Schema**
```bash
# 编辑 prisma/schema.prisma，应用上述 Schema 修改
# 然后创建迁移
npx prisma migrate dev --name fix_archive_detection_relation
```

**步骤 4：修改代码**
```bash
# 按照上述清单逐个修改文件
# 优先修改核心文件（优先级：高）
```

**步骤 5：测试**
```bash
# 运行测试用例
npm test

# 手动测试关键功能
# - 创建档案
# - 添加检测记录
# - 修改档案名称
# - 查询检测记录
# - 删除档案
```

**步骤 6：部署**
```bash
# 在生产环境执行
# 1. 数据备份
# 2. 运行数据修复脚本
# 3. 应用数据库迁移
# 4. 部署新代码
# 5. 验证功能
```

---

### 8. 测试计划

#### 单元测试

- [ ] 创建档案后添加检测记录
- [ ] 修改档案名称后，检测记录仍能正确关联
- [ ] 删除档案时，检测记录级联删除
- [ ] 查询档案时能正确获取所有检测记录

#### 集成测试

- [ ] 小程序创建检测记录流程
- [ ] 管理后台导出档案图片功能
- [ ] 档案详情页显示检测记录
- [ ] 统计数据准确性

#### 性能测试

- [ ] 对比修改前后查询性能（应该有提升）
- [ ] 大量数据下的查询性能

---

### 9. 回滚计划

如果修复后出现问题，按以下步骤回滚：

**步骤 1：回滚代码**
```bash
git revert <commit-hash>
git push origin dev
```

**步骤 2：回滚数据库**
```bash
# 恢复备份
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

**步骤 3：回滚 Schema**
```bash
# 如果已经应用了迁移，回滚迁移
npx prisma migrate resolve --rolled-back fix_archive_detection_relation
```

---

### 10. 风险评估

| 风险项 | 严重程度 | 可能性 | 缓解措施 |
|--------|---------|--------|----------|
| 数据丢失 | 高 | 低 | 完整备份 + 测试环境验证 |
| 业务中断 | 高 | 低 | 选择低峰期执行 + 快速回滚方案 |
| 性能下降 | 中 | 低 | 添加索引 + 性能测试 |
| 未发现的关联代码 | 中 | 中 | 全面代码审查 + 充分测试 |

---

### 11. 时间估算

| 阶段 | 预计时间 |
|------|---------|
| 代码修改 | 4-6 小时 |
| 数据修复脚本开发 | 2-3 小时 |
| 测试环境验证 | 3-4 小时 |
| 生产环境执行 | 1-2 小时 |
| **总计** | **10-15 小时** |

---

### 12. 后续优化

修复完成后，可以考虑以下优化：

1. **删除 archiveName 字段**（等待一段时间观察）
   - 确认所有功能正常后，可以考虑删除 `Detection.archiveName`
   - 减少数据冗余

2. **添加更多索引**
   - `Detection(archiveId, createdAt)` 复合索引
   - 优化常见查询场景

3. **数据一致性检查**
   - 定期检查 archiveId 的完整性
   - 监控孤立的检测记录

---

## 总结

这个修复方案将：
- ✅ 解决档案名称修改后检测记录丢失的问题
- ✅ 提升数据完整性和引用完整性
- ✅ 改善查询性能（使用 ID 索引）
- ✅ 简化代码逻辑（利用 Prisma 关系查询）
- ✅ 为未来的功能扩展打下良好基础

**建议在低峰期执行，并保持完整备份。**
