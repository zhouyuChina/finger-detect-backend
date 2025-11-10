# 当前问题汇总：archiveName vs archiveId

## 核心问题

**前端会更新 `archiveName`**，但代码中很多地方仍在用 `archiveName` 查询检测记录，导致：
- ❌ 修改档案名后，查询不到历史检测记录
- ❌ 删除档案时，删不掉检测记录（产生孤立数据）

## 当前使用 archiveName 查询的地方

### 1. **删除档案时** ⚠️ 严重问题
📄 [src/app/api/miniprogram/archives/[id]/route.js:214-227](../src/app/api/miniprogram/archives/[id]/route.js#L214-L227)

```javascript
// ❌ 统计检测记录数量
const detectionCount = await prisma.detection.count({
  where: {
    archiveName: archive.archiveName,  // 用 archiveName
    subUserId: archive.subUserId
  }
})

// ❌ 删除检测记录
await prisma.detection.deleteMany({
  where: {
    archiveName: archive.archiveName,  // 用 archiveName
    subUserId: archive.subUserId
  }
})
```

**问题场景：**
1. 创建档案 "左手大拇指" → archiveId: `abc123`
2. 添加 10 条检测记录 → archiveName: "左手大拇指"
3. 修改档案名为 "新名称" → archiveName: "新名称"
4. 删除档案
   - 查找 archiveName="新名称" 的检测记录 → 找不到！
   - detectionCount = 0
   - 删除操作删不掉检测记录 → **产生孤立数据**

---

### 2. **创建检测记录时查询已有记录** ⚠️
📄 [src/app/api/miniprogram/detection/route.js:448-463](../src/app/api/miniprogram/detection/route.js#L448-L463)

```javascript
// ❌ 查询已有检测记录
const existingDetections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: existingArchive.archiveName,  // 用 archiveName
    status: 'completed'
  }
})
```

**问题：** 如果档案名被改过，查不到历史检测记录。

---

### 3. **更新档案时使用复合键** ⚠️
📄 [src/app/api/miniprogram/detection/route.js:473-476](../src/app/api/miniprogram/detection/route.js#L473-L476)

```javascript
// ❌ 使用复合键 subUserId_archiveName
archive = await prisma.archive.update({
  where: {
    subUserId_archiveName: {
      subUserId: subUser.id,
      archiveName: existingArchive.archiveName
    }
  },
  data: { photoCount: { increment: 1 } }
})
```

**应该改为：**
```javascript
// ✅ 直接使用 ID
archive = await prisma.archive.update({
  where: { id: archiveId },
  data: { photoCount: { increment: 1 } }
})
```

---

### 4. **获取档案的最新检测记录** ⚠️
📄 [src/app/api/miniprogram/archive-detections/route.js:94-123](../src/app/api/miniprogram/archive-detections/route.js#L94-L123)

```javascript
// ❌ 使用 archiveName 查询
const [detections, total] = await Promise.all([
  prisma.detection.findMany({
    where: {
      subUserId: subUserId,
      archiveName: archive.archiveName  // 用 archiveName
    }
  }),
  prisma.detection.count({
    where: {
      subUserId: subUserId,
      archiveName: archive.archiveName  // 用 archiveName
    }
  })
])
```

**应该改为：**
```javascript
// ✅ 使用 archiveId
const [detections, total] = await Promise.all([
  prisma.detection.findMany({
    where: { archiveId: archiveId }
  }),
  prisma.detection.count({
    where: { archiveId: archiveId }
  })
])
```

---

### 5. **获取档案详情时的最新检测** ⚠️
📄 [src/app/api/miniprogram/archives/[id]/route.js:42-54](../src/app/api/miniprogram/archives/[id]/route.js#L42-L54)

```javascript
// ❌ 使用 archiveName
const latestDetection = await prisma.detection.findFirst({
  where: {
    archiveName: archive.archiveName,
    subUserId: archive.subUserId
  },
  orderBy: { createdAt: 'desc' }
})
```

**应该改为：**
```javascript
// ✅ 使用 archiveId
const latestDetection = await prisma.detection.findFirst({
  where: { archiveId: archive.id },
  orderBy: { createdAt: 'desc' }
})
```

---

### 6. **所有档案列表页获取最新图片** ⚠️
📄 [src/app/api/miniprogram/all-archives/route.js:86-98](../src/app/api/miniprogram/all-archives/route.js#L86-L98)

```javascript
// ❌ 使用 archiveName
const latestDetection = await prisma.detection.findFirst({
  where: {
    archiveName: archive.archiveName,
    subUserId: archive.subUserId
  },
  orderBy: { createdAt: 'desc' }
})
```

---

### 7. **detection-real 接口** ⚠️
📄 [src/app/api/miniprogram/detection-real/route.js:217-243](../src/app/api/miniprogram/detection-real/route.js#L217-L243)

```javascript
// ❌ 查询已有检测记录
const allExistingDetections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: existingArchive.archiveName,  // 用 archiveName
    status: 'completed'
  }
})

// ❌ 查询异常记录
const existingAbnormalDetections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: existingArchive.archiveName,  // 用 archiveName
    status: 'completed',
    result: 'onychomycosis'
  }
})
```

---

### 8. **删除检测记录时更新档案** ⚠️
📄 [src/app/api/detections/[id]/route.js:141-145](../src/app/api/detections/[id]/route.js#L141-L145)

```javascript
// ❌ 使用 archiveName 更新档案
await prisma.archive.updateMany({
  where: {
    archiveName: existingDetection.archiveName,
    subUserId: existingDetection.subUserId
  },
  data: { photoCount: { decrement: 1 } }
})
```

**问题：** 如果档案名被改过，更新不到档案。

---

## 修改目标

将所有使用 `archiveName` 查询的地方改为使用 `archiveId`：

### 查询检测记录
```javascript
// ❌ 修改前
where: {
  archiveName: xxx,
  subUserId: yyy
}

// ✅ 修改后
where: {
  archiveId: xxx
}
```

### 更新档案
```javascript
// ❌ 修改前
where: {
  subUserId_archiveName: {
    subUserId: xxx,
    archiveName: yyy
  }
}

// ✅ 修改后
where: {
  id: archiveId
}
```

### 删除档案
```javascript
// ❌ 修改前
// 1. 统计
const count = await prisma.detection.count({
  where: { archiveName: xxx, subUserId: yyy }
})
// 2. 删除检测记录
await prisma.detection.deleteMany({
  where: { archiveName: xxx, subUserId: yyy }
})
// 3. 删除档案
await prisma.archive.delete({ where: { id } })

// ✅ 修改后（如果有外键）
const count = await prisma.detection.count({
  where: { archiveId: id }
})
await prisma.archive.delete({ where: { id } })  // 自动级联删除

// ✅ 修改后（如果没有外键）
const count = await prisma.detection.count({
  where: { archiveId: id }
})
await prisma.detection.deleteMany({
  where: { archiveId: id }
})
await prisma.archive.delete({ where: { id } })
```

---

## 需要修改的文件列表

### 高优先级（必须修改）
1. ✅ src/app/api/miniprogram/archives/[id]/route.js（删除档案）
2. ✅ src/app/api/miniprogram/detection/route.js（创建检测）
3. ✅ src/app/api/miniprogram/archive-detections/route.js（查询检测）
4. ✅ src/app/api/miniprogram/all-archives/route.js（档案列表）
5. ✅ src/app/api/miniprogram/detection-real/route.js（真实检测）
6. ✅ src/app/api/detections/[id]/route.js（删除检测记录）

### 中优先级
7. src/app/api/miniprogram/detection-fixed/route.js
8. src/app/api/miniprogram/photo-record/route.js
9. src/app/api/archives/export-images/route.js
10. src/app/api/detections/route.js

---

## 测试场景

修改完成后，必须测试以下场景：

### 场景 1：修改档案名后查询检测记录
1. 创建档案 "左手大拇指"
2. 添加 3 条检测记录
3. 修改档案名为 "新名称"
4. 查询检测记录 → 应该能查到 3 条

### 场景 2：修改档案名后删除档案
1. 创建档案 "右手食指"
2. 添加 5 条检测记录
3. 修改档案名为 "测试名称"
4. 删除档案 → 应该删除档案 + 5 条检测记录

### 场景 3：档案详情显示最新图片
1. 创建档案
2. 添加检测记录
3. 修改档案名
4. 查看档案详情 → 应该显示最新图片

---

## 方案选择

### 方案 A：只改代码 ⚡
- 时间：2-3 小时
- 优点：快速
- 缺点：没有外键保护，需要手动删除检测记录

### 方案 B：改代码 + Schema 🌟
- 时间：3-4 小时
- 优点：有外键保护，自动级联删除
- 缺点：多 30 分钟 Schema 迁移

**推荐：方案 B**（多 30 分钟换来数据安全）

---

## 下一步

请确认：
1. 是否选择方案 A 还是方案 B？
2. 我可以立即开始修改吗？
