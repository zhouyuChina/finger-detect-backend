# 档案管理API文档

## 概述

档案管理API提供档案的查询和创建功能。档案是用户创建的检测记录集合，每个档案包含多个检测记录（图片）。

## 接口列表

### 1. 获取档案列表

**接口地址：** `GET /api/miniprogram/archives`

**功能描述：** 获取指定用户的档案列表，包含每个档案的最新检测图片信息

#### 请求参数

**Query Parameters:**
- `username` (string, 必填) - 用户名
- `page` (number, 可选) - 页码，默认1
- `limit` (number, 可选) - 每页数量，默认10

**Headers:**
- `x-openid` (string, 必填) - 微信用户openid

#### 请求示例

```bash
curl -X GET "http://localhost:3001/api/miniprogram/archives?username=测试用户&page=1&limit=10" \
  -H "x-openid: test_openid_123"
```

#### 响应格式

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "subUser": {
      "id": "cmdwc5yvh000os6jqmgjqu5c5",
      "username": "测试用户",
      "realName": "测试用户"
    },
    "archives": [
      {
        "id": "cmdwczbdx000fs6rh4em8iyug",
        "archiveName": "左手食指",
        "activity": "high",
        "photoCount": 3,
        "bodyPart": "fingerprint",
        "detectionTime": "2025-08-04T00:15:01.220Z",
        "createdAt": "2025-08-04T00:15:01.222Z",
        "updatedAt": "2025-08-04T00:15:01.222Z",
        "imageUrl": "http://example.com/images/左手食指_3.jpg",
        "result": "normal",
        "confidence": 0.9935530589851438,
        "latestDetectionTime": "2025-08-04T00:15:01.222Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  },
  "message": "获取档案列表成功",
  "code": 200
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "请提供用户名参数",
  "code": 400
}
```

**错误响应 (404):**
```json
{
  "success": false,
  "data": null,
  "message": "用户不存在或无权限访问",
  "code": 404
}
```

#### 字段说明

**archives数组字段:**
- `id` - 档案ID
- `archiveName` - 档案名称
- `activity` - 活跃度 (high/medium/low/inactive)
- `photoCount` - 拍照数量
- `bodyPart` - 检测部位 (fingerprint/face/iris/voice)
- `detectionTime` - 检测时间
- `createdAt` - 创建时间
- `updatedAt` - 更新时间
- `imageUrl` - 最新检测图片地址
- `result` - 最新检测结果 (normal/abnormal)
- `confidence` - 最新检测置信度 (0-1)
- `latestDetectionTime` - 最新检测时间

---

### 2. 新增档案

**接口地址：** `POST /api/miniprogram/archives`

**功能描述：** 创建新的档案记录

#### 请求参数

**Headers:**
- `Content-Type: application/json`
- `x-openid` (string, 必填) - 微信用户openid

**Request Body:**
```json
{
  "username": "测试用户",
  "archiveName": "左手食指",
  "bodyPart": "left_hand_thumb",
  "activity": "high",
  "photoCount": 0,
  "imageUrl": "http://example.com/images/left_hand_thumb.jpg"
}
```

#### 字段说明

**Request Body字段:**
- `username` (string, 必填) - 用户名
- `archiveName` (string, 必填) - 档案名称，长度2-50字符
- `bodyPart` (string, 可选) - 检测部位，默认"left_hand_thumb"
  - 可选值: 
    - 左手: "left_hand_thumb", "left_hand_index", "left_hand_middle", "left_hand_ring", "left_hand_little"
    - 右手: "right_hand_thumb", "right_hand_index", "right_hand_middle", "right_hand_ring", "right_hand_little"
    - 左脚: "left_foot_big", "left_foot_second", "left_foot_third", "left_foot_fourth", "left_foot_little"
    - 右脚: "right_foot_big", "right_foot_second", "right_foot_third", "right_foot_fourth", "right_foot_little"
- `activity` (string, 可选) - 活跃度，默认"medium"
  - 可选值: "high", "medium", "low", "inactive"
- `photoCount` (number, 可选) - 拍照数量，默认0
- `imageUrl` (string, 必填) - 图片URL地址

#### 请求示例

```bash
curl -X POST "http://localhost:3001/api/miniprogram/archives" \
  -H "Content-Type: application/json" \
  -H "x-openid: test_openid_123" \
  -d '{
    "username": "测试用户",
    "archiveName": "左手食指",
    "bodyPart": "left_hand_thumb",
    "activity": "high",
    "photoCount": 0,
    "imageUrl": "http://example.com/images/left_hand_thumb.jpg"
  }'
```

#### 响应格式

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "archive": {
      "id": "cmdwda96o000qs6jqhg32z6i1",
      "subUserId": "cmdwc5yvh000os6jqmgjqu5c5",
      "archiveName": "左手食指",
      "bodyPart": "left_hand_thumb",
      "activity": "high",
      "photoCount": 1,
      "detectionTime": "2025-08-04T00:23:31.584Z",
      "createdAt": "2025-08-04T00:23:31.585Z",
      "updatedAt": "2025-08-04T00:23:31.585Z"
    },
    "detection": {
      "id": "cmdwda96o000qs6jqhg32z6i2",
      "archiveName": "左手食指",
      "detectionType": "left_hand_thumb",
      "imageUrl": "http://example.com/images/left_hand_thumb.jpg",
      "result": "normal",
      "confidence": 0.9,
      "status": "completed",
      "detectionTime": "2025-08-04T00:23:31.584Z",
      "createdAt": "2025-08-04T00:23:31.585Z"
    }
  },
  "message": "档案创建成功",
  "code": 200
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "用户名、档案名称和图片URL为必填项",
  "code": 400
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "档案名称长度应在2-50个字符之间",
  "code": 400
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "检测类型无效",
  "code": 400
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "图片URL格式不正确",
  "code": 400
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "data": null,
  "message": "档案名称已存在",
  "code": 400
}
```

**错误响应 (404):**
```json
{
  "success": false,
  "data": null,
  "message": "用户不存在或无权限操作",
  "code": 404
}
```

#### 字段说明

**Response Data字段:**

**archive对象:**
- `id` - 档案ID
- `subUserId` - 子用户ID
- `archiveName` - 档案名称
- `bodyPart` - 检测部位
- `activity` - 活跃度
- `photoCount` - 拍照数量
- `detectionTime` - 检测时间
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**detection对象:**
- `id` - 检测记录ID
- `archiveName` - 档案名称
- `detectionType` - 检测类型
- `imageUrl` - 图片URL
- `result` - 检测结果
- `confidence` - 置信度
- `status` - 状态
- `detectionTime` - 检测时间
- `createdAt` - 创建时间

---

## 业务逻辑说明

### 档案与检测记录的关系

1. **档案创建** = 第一次检测记录（包含报告）
2. **后续检测** = 只有图片，无报告
3. **档案列表** = 显示最新图片

### 数据流程

1. 用户创建档案时，系统在`archives`表中创建记录
2. 用户进行检测时，系统在`detections`表中创建记录
3. 获取档案列表时，系统关联查询每个档案的最新检测记录
4. 返回档案信息时包含最新图片URL、检测结果、置信度等

### 注意事项

1. **URL编码** - 中文用户名需要URL编码
2. **档案名称唯一性** - 同一用户下档案名称不能重复
3. **权限验证** - 只能操作自己的档案
4. **数据一致性** - 档案统计数量会自动更新

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 用户不存在或无权限 |
| 500 | 服务器内部错误 |

---

## 测试数据

可以使用以下测试数据：

**用户信息:**
- openid: `test_openid_123`
- username: `测试用户`

**测试档案:**
- 档案名称: `左手食指`
- 检测部位: `fingerprint`
- 活跃度: `high` 