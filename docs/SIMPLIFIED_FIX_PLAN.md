# 简化版修复方案：直接使用 archiveId

## 背景

由于：
- ✅ Detection 表中已有 `archiveId` 字段
- ✅ 当前数据库无历史数据
- ✅ 可以直接使用 `archiveId` + 外键关系

因此，我们不需要复杂的数据迁移，只需要：
1. 修改 Schema 添加外键约束
2. 修改代码使用 `archiveId` 查询

---

## 第一步：修改 Schema

### 修改 prisma/schema.prisma

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

  // ⚠️ 保留用于兼容（后续可删除）
  archiveName   String?

  subUserId     String
  subUser       SubUser  @relation(fields: [subUserId], references: [id], onDelete: Cascade)

  @@index([archiveId])
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

### 应用迁移

```bash
# 创建迁移
npx prisma migrate dev --name add_archive_relation

# 生成 Prisma Client
npx prisma generate
```

---

## 第二步：修改代码

### 核心修改原则

将所有使用 `archiveName` 的地方改为使用 `archiveId`。

### 主要修改文件

#### 1. src/app/api/miniprogram/detection/route.js

**查询检测记录时：**
```javascript
// ❌ 修改前
const existingDetections = await prisma.detection.findMany({
  where: {
    subUserId: subUser.id,
    archiveName: existingArchive.archiveName
  }
})

// ✅ 修改后
const existingDetections = await prisma.detection.findMany({
  where: {
    archiveId: archiveId  // 直接使用 archiveId
  }
})
```

**创建检测记录时：**
```javascript
// ❌ 修改前
await prisma.detection.create({
  data: {
    subUserId: subUser.id,
    archiveName: archive.archiveName,
    imageUrl,
    result,
    confidence
  }
})

// ✅ 修改后
await prisma.detection.create({
  data: {
    archiveId: archiveId,  // 使用 archiveId
    imageUrl,
    result,
    confidence
  }
})
```

**更新档案时：**
```javascript
// ❌ 修改前
await prisma.archive.update({
  where: {
    subUserId_archiveName: {
      subUserId: subUser.id,
      archiveName: existingArchive.archiveName
    }
  },
  data: { photoCount: { increment: 1 } }
})

// ✅ 修改后
await prisma.archive.update({
  where: { id: archiveId },  // 直接使用 ID
  data: { photoCount: { increment: 1 } }
})
```

#### 2. src/app/api/miniprogram/archive-detections/route.js

```javascript
// ❌ 修改前
const detections = await prisma.detection.findMany({
  where: {
    subUserId: subUserId,
    archiveName: archive.archiveName
  }
})

// ✅ 修改后
const detections = await prisma.detection.findMany({
  where: {
    archiveId: archiveId
  }
})

// ✅✅ 更好的方式：使用关系查询
const archive = await prisma.archive.findFirst({
  where: { id: archiveId, subUserId: subUserId },
  include: {
    detections: {
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }
  }
})
```

#### 3. src/app/api/miniprogram/archives/[id]/route.js

**获取档案详情时：**
```javascript
// ✅ 使用关系查询
const archive = await prisma.archive.findUnique({
  where: { id },
  include: {
    subUser: true,
    detections: {
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  }
})

const latestDetection = archive.detections[0] || null
```

**删除档案时：**
```javascript
// ✅ 由于有外键 onDelete: Cascade，直接删除即可
const detectionCount = await prisma.detection.count({
  where: { archiveId: id }
})

await prisma.archive.delete({
  where: { id }  // 会自动级联删除检测记录
})
```

---

## 第三步：测试

### 测试用例

```bash
# 1. 创建档案
curl -X POST http://localhost:3000/api/miniprogram/archives \
  -H "Content-Type: application/json" \
  -d '{
    "subUserId": "xxx",
    "archiveName": "左手大拇指",
    "bodyPart": "left_hand_thumb"
  }'

# 2. 创建检测记录（使用返回的 archiveId）
curl -X POST http://localhost:3000/api/miniprogram/detection \
  -H "Content-Type: application/json" \
  -d '{
    "subUserId": "xxx",
    "archiveId": "返回的archiveId",
    "detectionType": "left_hand_thumb",
    "imageUrl": "https://..."
  }'

# 3. 修改档案名称
curl -X PUT http://localhost:3000/api/miniprogram/archives/{archiveId} \
  -H "Content-Type: application/json" \
  -d '{
    "archiveName": "新的名称"
  }'

# 4. 查询检测记录（验证关联仍然存在）
curl -X GET "http://localhost:3000/api/miniprogram/archive-detections?archiveId={archiveId}&subUserId={subUserId}"
```

---

## 执行清单

- [ ] 修改 prisma/schema.prisma
- [ ] 运行 `npx prisma migrate dev --name add_archive_relation`
- [ ] 运行 `npx prisma generate`
- [ ] 修改代码文件（约 18 个）
- [ ] 本地测试
- [ ] 部署到测试环境
- [ ] 测试环境验证
- [ ] 部署到生产环境

---

## 优势

相比原方案，这个简化方案：
- ✅ 不需要数据修复脚本
- ✅ 不需要数据迁移
- ✅ 执行时间更短（3-5小时 vs 10-15小时）
- ✅ 风险更低（没有数据修改）
- ✅ 更容易回滚

---

## 搜索和替换

使用以下命令快速查找需要修改的地方：

```bash
# 查找所有使用 archiveName 查询的地方
grep -rn "archiveName.*:" src/app/api --include="*.js"

# 查找所有使用 subUserId_archiveName 的地方
grep -rn "subUserId_archiveName" src/app/api --include="*.js"
```

---

## 总结

由于系统中已经有 `archiveId` 字段且没有历史数据，我们只需要：
1. 添加外键约束
2. 修改代码使用 `archiveId`

不需要复杂的数据迁移！🎉
