# 方案选择：是否修改 Schema？

## 背景

当前 `Detection` 表已经有 `archiveId` 字段，但：
- 是可选的（`String?`，可以为 null）
- 没有外键约束
- 没有定义与 `Archive` 的关系

## 两种方案对比

### 方案 A：只改代码，不改 Schema ⚡

**操作：** 只修改代码，将所有 `archiveName` 查询改为 `archiveId` 查询

**优点：**
- ✅ 最快速（1-2小时代码修改）
- ✅ 不需要数据库迁移
- ✅ 没有 Schema 变更风险
- ✅ 可以立即实施

**缺点：**
- ❌ 没有外键约束，数据完整性无保证
- ❌ 删除档案时需要手动删除检测记录
- ❌ 可以插入不存在的 archiveId（脏数据）
- ❌ archiveId 仍可为 null（业务逻辑不合理）
- ❌ 数据库层面无法保证一致性

**代码示例：**
```javascript
// 只需修改代码，Schema 保持不变

// ❌ 修改前
const detections = await prisma.detection.findMany({
  where: {
    archiveName: archiveName,
    subUserId: subUserId
  }
})

// ✅ 修改后
const detections = await prisma.detection.findMany({
  where: {
    archiveId: archiveId
  }
})

// ⚠️ 删除档案时需要手动删除检测记录
const detectionCount = await prisma.detection.count({
  where: { archiveId: id }
})

await prisma.detection.deleteMany({
  where: { archiveId: id }
})

await prisma.archive.delete({
  where: { id }
})
```

---

### 方案 B：修改 Schema + 代码（推荐）🌟

**操作：**
1. 修改 Schema 添加外键约束
2. 修改代码使用 archiveId

**优点：**
- ✅ 数据完整性有保证（外键约束）
- ✅ 自动级联删除（`onDelete: Cascade`）
- ✅ 无法插入无效的 archiveId
- ✅ archiveId 必填，符合业务逻辑
- ✅ 可以使用 Prisma 关系查询
- ✅ 数据库层面保证一致性

**缺点：**
- ⚠️ 需要数据库迁移（但很简单）
- ⚠️ 多 30 分钟工作量

**Schema 修改：**
```prisma
model Detection {
  // ... 其他字段

  // ✅ 改为必填 + 添加外键
  archiveId     String
  archive       Archive  @relation(fields: [archiveId], references: [id], onDelete: Cascade)

  // ... 其他字段
}

model Archive {
  // ... 其他字段

  // ✅ 添加反向关系
  detections    Detection[]

  // ... 其他字段
}
```

**代码示例：**
```javascript
// 查询更简单，可以使用关系
const archive = await prisma.archive.findUnique({
  where: { id: archiveId },
  include: {
    detections: {
      orderBy: { createdAt: 'desc' }
    }
  }
})

// 删除更简单，自动级联
await prisma.archive.delete({
  where: { id }  // 会自动删除所有相关检测记录
})
```

---

## 具体差异

### 数据完整性

**方案 A（无外键）：**
```javascript
// ⚠️ 可以插入不存在的 archiveId
await prisma.detection.create({
  data: {
    archiveId: "不存在的ID",  // 数据库不会报错！
    imageUrl: "...",
    // ...
  }
})

// ⚠️ 删除档案后，检测记录变成孤立数据
await prisma.archive.delete({ where: { id } })
// 检测记录仍然存在，但 archiveId 指向已删除的档案
```

**方案 B（有外键）：**
```javascript
// ✅ 插入无效 archiveId 会报错
await prisma.detection.create({
  data: {
    archiveId: "不存在的ID",  // 数据库会报错：外键约束违反
    imageUrl: "...",
    // ...
  }
})

// ✅ 删除档案自动删除检测记录
await prisma.archive.delete({ where: { id } })
// 所有相关检测记录自动删除，无孤立数据
```

### 代码复杂度

**方案 A：需要手动管理删除**
```javascript
// 删除档案时
async function deleteArchive(id) {
  // 1. 手动统计
  const count = await prisma.detection.count({
    where: { archiveId: id }
  })

  // 2. 手动删除检测记录
  await prisma.detection.deleteMany({
    where: { archiveId: id }
  })

  // 3. 删除档案
  await prisma.archive.delete({
    where: { id }
  })

  // 4. 手动更新计数
  await prisma.subUser.update({
    where: { id: subUserId },
    data: {
      photos: { decrement: count }
    }
  })
}
```

**方案 B：自动级联，代码更简洁**
```javascript
// 删除档案时
async function deleteArchive(id) {
  // 统计（可选）
  const count = await prisma.detection.count({
    where: { archiveId: id }
  })

  // 删除档案（自动级联删除检测记录）
  await prisma.archive.delete({
    where: { id }
  })

  // 只需更新计数
  await prisma.subUser.update({
    where: { id: subUserId },
    data: {
      photos: { decrement: count }
    }
  })
}
```

---

## 执行成本对比

| 项目 | 方案 A（无外键） | 方案 B（有外键） |
|------|-----------------|-----------------|
| Schema 修改 | 0 分钟 | 5 分钟 |
| 数据库迁移 | 0 分钟 | 2 分钟 |
| 代码修改 | 2-3 小时 | 2-3 小时 |
| 测试验证 | 1-2 小时 | 1-2 小时 |
| **总计** | **3-5 小时** | **3.5-5.5 小时** |
| **风险** | 中（数据一致性） | 低 |

---

## 推荐决策

### 如果你想要：
- **最快实施** → 选择方案 A
- **长期稳定** → 选择方案 B ⭐
- **数据安全** → 选择方案 B ⭐

### 我的推荐：方案 B

虽然方案 B 多花 30 分钟，但带来的好处远大于成本：
1. 数据完整性有保证
2. 代码更简洁
3. 维护成本更低
4. 避免未来的数据问题

---

## 方案 B 的执行步骤

如果选择方案 B，只需 3 步：

### 步骤 1：修改 Schema（5 分钟）

编辑 `prisma/schema.prisma`：

```prisma
model Detection {
  // ... 其他字段保持不变

  // 修改这两行
  archiveId     String   // 从 String? 改为 String
  archive       Archive  @relation(fields: [archiveId], references: [id], onDelete: Cascade)  // 新增

  // 可选：将 archiveName 改为可选（后续可删除）
  archiveName   String?

  // ... 其他字段保持不变

  @@index([archiveId])  // 新增索引
}

model Archive {
  // ... 其他字段保持不变

  detections    Detection[]  // 新增反向关系

  // ... 其他字段保持不变
}
```

### 步骤 2：应用迁移（2 分钟）

```bash
npx prisma migrate dev --name add_archive_relation
npx prisma generate
```

### 步骤 3：修改代码（3 小时）

按照之前的清单修改代码，将 `archiveName` 改为 `archiveId`。

---

## 你的选择？

请问你想选择哪个方案？

- **方案 A**：只改代码（最快，但无外键保护）
- **方案 B**：改 Schema + 代码（推荐，数据安全）

我可以帮你立即执行任何一个方案！
