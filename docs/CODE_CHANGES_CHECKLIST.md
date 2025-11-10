# 代码修改清单

## 概述

本文档详细列出了修复 Archive-Detection 关联关系所需的所有代码修改。

**修改原则：**
- 将所有使用 `archiveName` 查询的地方改为使用 `archiveId`
- 创建检测记录时使用 `archiveId` 而非 `archiveName`
- 利用 Prisma 的关系查询简化代码
- 删除 `subUserId_archiveName` 复合键的使用

---

## 优先级 1：核心文件（必须修改）

### 1. src/app/api/miniprogram/detection/route.js

**影响：** 创建检测记录的核心逻辑

**需要修改的位置：**

#### 位置 1：查询已有检测记录（第 448-463 行）
```javascript
// ❌ 修改前
const existingDetections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: existingArchive.archiveName,  // 使用 archiveName
    status: 'completed'
  },
  // ...
})

// ✅ 修改后
const existingDetections = await prisma.detection.findMany({
  where: {
    archiveId: existingArchive.id,  // 使用 archiveId
    status: 'completed'
  },
  // ...
})
```

#### 位置 2：更新档案（第 472-497 行）
```javascript
// ❌ 修改前
archive = await prisma.archive.update({
  where: {
    subUserId_archiveName: {  // 使用复合键
      subUserId: subUser.id,
      archiveName: existingArchive.archiveName
    }
  },
  data: {
    photoCount: { increment: 1 },
    detectionTime: new Date(),
    updatedAt: new Date()
  },
  // ...
})

// ✅ 修改后
archive = await prisma.archive.update({
  where: {
    id: existingArchive.id  // 直接使用 ID
  },
  data: {
    photoCount: { increment: 1 },
    detectionTime: new Date()
  },
  // ...
})
```

#### 位置 3：创建检测记录（第 532-558 行）
```javascript
// ❌ 修改前
const newDetection = await prisma.detection.create({
  data: {
    subUserId: subUser.id,
    archiveName: archive.archiveName,  // 使用 archiveName
    detectionType,
    imageUrl,
    result: thirdPartyResult.data.result,
    confidence: thirdPartyResult.data.confidence,
    status: 'completed',
    remark: `检测类型: ${detectionType}, 置信度: ${thirdPartyResult.data.confidence}`
  },
  // ...
})

// ✅ 修改后
const newDetection = await prisma.detection.create({
  data: {
    archiveId: archive.id,  // 使用 archiveId
    detectionType,
    imageUrl,
    result: thirdPartyResult.data.result,
    confidence: thirdPartyResult.data.confidence,
    status: 'completed',
    remark: `检测类型: ${detectionType}, 置信度: ${thirdPartyResult.data.confidence}`
  },
  include: {
    archive: true  // 包含档案信息
  }
})
```

**注意：** 创建检测记录时通过 Prisma 关系自动填充 `subUserId`，无需手动指定。

---

### 2. src/app/api/miniprogram/archive-detections/route.js

**影响：** 获取档案的所有检测记录

**需要修改的位置：**

#### 位置 1：查询检测记录（第 94-116 行）
```javascript
// ❌ 修改前
const [detections, total] = await Promise.all([
  prisma.detection.findMany({
    where: {
      subUserId: subUserId,
      archiveName: archive.archiveName  // 使用 archiveName
    },
    // ...
  }),
  prisma.detection.count({
    where: {
      subUserId: subUserId,
      archiveName: archive.archiveName  // 使用 archiveName
    }
  })
])

// ✅ 修改后
const [detections, total] = await Promise.all([
  prisma.detection.findMany({
    where: {
      archiveId: archive.id  // 使用 archiveId
    },
    // ...
  }),
  prisma.detection.count({
    where: {
      archiveId: archive.id  // 使用 archiveId
    }
  })
])
```

**或者使用 Prisma 关系查询（更优雅）：**

```javascript
// ✅✅ 更好的方式：直接从档案查询
const archive = await prisma.archive.findFirst({
  where: {
    id: archiveId,
    subUserId: subUserId
  },
  include: {
    detections: {
      where: { status: 'completed' },  // 可选过滤条件
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    },
    _count: {
      select: { detections: true }
    }
  }
})

if (!archive) {
  return createErrorResponse('档案不存在或无权限访问', 404)
}

const detections = archive.detections
const total = archive._count.detections
```

---

### 3. src/app/api/miniprogram/archives/[id]/route.js

**影响：** 删除档案时级联删除检测记录

**需要修改的位置：**

#### 位置 1：获取最新检测记录（第 42-54 行）
```javascript
// ❌ 修改前
const latestDetection = await prisma.detection.findFirst({
  where: {
    archiveName: archive.archiveName,
    subUserId: archive.subUserId
  },
  // ...
})

// ✅ 修改后
const latestDetection = await prisma.detection.findFirst({
  where: {
    archiveId: archive.id
  },
  select: {
    imageUrl: true,
    result: true,
    confidence: true,
    detectionTime: true
  },
  orderBy: { createdAt: 'desc' }
})
```

**或者使用 Prisma 关系查询：**

```javascript
// ✅✅ 更好的方式
const archive = await prisma.archive.findUnique({
  where: { id },
  include: {
    subUser: {
      select: {
        id: true,
        username: true,
        realName: true,
        wechatUserId: true
      }
    },
    detections: {
      select: {
        imageUrl: true,
        result: true,
        confidence: true,
        detectionTime: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  }
})

const latestDetection = archive.detections[0] || null
```

#### 位置 2：删除档案和检测记录（第 214-244 行）

**重要：** 由于 Schema 中已经定义了 `onDelete: Cascade`，删除档案时会自动删除相关检测记录，无需手动删除。

```javascript
// ❌ 修改前
// 统计该档案的检测记录数量
const detectionCount = await prisma.detection.count({
  where: {
    archiveName: archive.archiveName,
    subUserId: archive.subUserId
  }
})

// 删除该档案关联的所有检测记录
await prisma.detection.deleteMany({
  where: {
    archiveName: archive.archiveName,
    subUserId: archive.subUserId
  }
})

// 删除档案
await prisma.archive.delete({
  where: { id }
})

// ✅ 修改后 - 简化！
// 由于外键设置了 onDelete: Cascade，直接删除档案即可
const detectionCount = await prisma.detection.count({
  where: { archiveId: archive.id }
})

// 删除档案（会自动级联删除检测记录）
await prisma.archive.delete({
  where: { id }
})
```

---

### 4. src/app/api/detections/route.js

**影响：** 管理后台查询检测记录

**需要修改的位置：**

#### 位置 1：查询条件（第 41-43 行）
```javascript
// ❌ 修改前
if (archiveName) {
  where.archiveName = archiveName
}

// ✅ 修改后
if (archiveId) {
  where.archiveId = archiveId
}
```

**同时需要修改接口参数：**
```javascript
// 从查询参数中获取 archiveId 而不是 archiveName
const archiveId = searchParams.get('archiveId')
```

---

### 5. src/app/api/archives/[id]/route.js

**影响：** 管理后台档案详情

**需要修改的位置：**

类似于小程序的档案详情接口，参考 `src/app/api/miniprogram/archives/[id]/route.js` 的修改。

---

## 优先级 2：次要文件

### 6. src/app/api/miniprogram/archives/route.js

**需要修改的位置：** 创建档案后可能的检测记录查询

查找文件中所有 `archiveName` 的使用，改为 `archiveId`。

---

### 7. src/app/api/archives/export-images/route.js

**影响：** 导出档案图片

**需要修改的位置：**

#### 位置 1：查询条件（第 47-50 行）
```javascript
// ❌ 修改前
if (archiveId) {
  whereCondition.archiveId = archiveId
} else if (archiveName) {
  whereCondition.archiveName = archiveName  // 删除这个分支
}

// ✅ 修改后
if (archiveId) {
  whereCondition.archiveId = archiveId
}
// 删除 archiveName 分支
```

同时删除 `archiveName` 相关的参数获取和验证。

---

### 8-15. 其他文件

以下文件需要类似的修改：

- **src/app/api/miniprogram/detection-real/route.js**
- **src/app/api/miniprogram/detection-fixed/route.js**
- **src/app/api/miniprogram/photo-record/route.js**
- **src/app/api/miniprogram/all-archives/route.js**
- **src/app/api/archives/route.js**
- **src/app/api/archives/export-all-images/route.js**
- **src/app/api/detections/[id]/route.js**
- **src/app/api/detections/export/route.js**

**修改原则：**
1. 将所有 `archiveName: xxx` 改为 `archiveId: xxx`
2. 删除 `subUserId_archiveName` 复合键的使用
3. 利用 Prisma 关系查询获取档案信息

---

## 优先级 3：调试和文档文件

### 16. src/app/api/debug-export/route.js

更新调试代码中的查询条件。

### 17. src/app/api/miniprogram/debug/route.js

更新调试代码中的查询条件。

### 18. src/app/api/miniprogram/README.md

更新 API 文档，说明：
- 使用 `archiveId` 参数而不是 `archiveName`
- 更新请求示例
- 更新响应示例

---

## 通用修改模式

### 模式 1：查询检测记录

```javascript
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
```

### 模式 2：创建检测记录

```javascript
// ❌ 修改前
await prisma.detection.create({
  data: {
    subUserId: subUserId,
    archiveName: archiveName,
    imageUrl: imageUrl,
    // ...
  }
})

// ✅ 修改后
await prisma.detection.create({
  data: {
    archiveId: archiveId,
    imageUrl: imageUrl,
    // ...（subUserId 通过外键关系自动填充）
  }
})
```

### 模式 3：统计检测记录

```javascript
// ❌ 修改前
const count = await prisma.detection.count({
  where: {
    archiveName: archiveName,
    subUserId: subUserId
  }
})

// ✅ 修改后
const count = await prisma.detection.count({
  where: {
    archiveId: archiveId
  }
})
```

### 模式 4：删除检测记录

```javascript
// ❌ 修改前
await prisma.detection.deleteMany({
  where: {
    archiveName: archiveName,
    subUserId: subUserId
  }
})

// ✅ 修改后
// 方式 1：直接删除档案（级联删除）
await prisma.archive.delete({
  where: { id: archiveId }
})

// 方式 2：只删除检测记录
await prisma.detection.deleteMany({
  where: {
    archiveId: archiveId
  }
})
```

### 模式 5：利用 Prisma 关系查询

```javascript
// ✅ 推荐方式：一次查询获取档案和检测记录
const archive = await prisma.archive.findUnique({
  where: { id: archiveId },
  include: {
    detections: {
      orderBy: { createdAt: 'desc' },
      take: 10
    },
    _count: {
      select: { detections: true }
    }
  }
})

// 访问数据
const detections = archive.detections
const totalCount = archive._count.detections
```

---

## 修改检查清单

修改完成后，使用以下清单检查：

- [ ] Schema 已修改并应用迁移
- [ ] 数据修复脚本已执行
- [ ] 所有使用 `archiveName` 查询的地方已改为 `archiveId`
- [ ] 所有创建检测记录的地方使用 `archiveId`
- [ ] 删除了 `subUserId_archiveName` 复合键的使用
- [ ] API 文档已更新
- [ ] 单元测试已更新
- [ ] 集成测试已通过
- [ ] 在测试环境验证功能正常

---

## 搜索命令

使用以下命令查找可能遗漏的代码：

```bash
# 查找所有使用 archiveName 的地方
grep -rn "archiveName" src/app/api --include="*.js" --color

# 查找所有使用 subUserId_archiveName 的地方
grep -rn "subUserId_archiveName" src/app/api --include="*.js" --color

# 查找 Detection.create 调用
grep -rn "detection.create" src/app/api --include="*.js" --color -i

# 查找 Detection.findMany 调用
grep -rn "detection.findMany" src/app/api --include="*.js" --color -i
```

---

## 注意事项

1. **保留 archiveName 字段**（暂时）
   - 在初期保留 `Detection.archiveName` 字段用于调试
   - 等待系统稳定运行一段时间后再删除

2. **双写策略**（可选）
   - 如果担心兼容性，可以在创建检测记录时同时设置 `archiveId` 和 `archiveName`
   - 查询时优先使用 `archiveId`，兼容 `archiveName`

3. **数据验证**
   - 修改完成后运行数据验证脚本
   - 确保所有检测记录都有有效的 `archiveId`

4. **监控日志**
   - 部署后监控错误日志
   - 特别注意外键约束错误

---

## 预期结果

修改完成后：
- ✅ 修改档案名称不影响检测记录关联
- ✅ 数据完整性得到保证（外键约束）
- ✅ 查询性能提升（使用索引）
- ✅ 代码更简洁（利用 Prisma 关系）
- ✅ 删除档案时自动级联删除检测记录
