# 档案管理接口文档

## 概述

档案管理接口用于在微信小程序中管理用户的档案信息。通过 openid + 用户名来确保查询的准确性。

**基础路径**: `/api/miniprogram/archives`

**认证方式**: 需要微信小程序认证（X-Openid 头部）

---

## 1. 获取档案列表

### 接口信息

- **方法**: `GET`
- **路径**: `/api/miniprogram/archives`
- **描述**: 获取指定用户的档案列表

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

### 请求头

```
X-Openid: {openid}  // 微信用户的 openid
```

### 请求示例

```
GET /api/miniprogram/archives?username=subuser001&page=1&limit=10
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "subUser": {
      "id": "cmdw3r532000splzxlhr67jtc",
      "username": "subuser001",
      "realName": "张三"
    },
    "archives": [
      {
        "id": "cmdw3r532000splzxlhr67jtc",
        "archiveName": "张三档案1",
        "activity": "high",
        "photoCount": 10,
        "bodyPart": "fingerprint",
        "detectionTime": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "获取档案列表成功",
  "code": 200
}
```

### 响应字段说明

#### subUser 字段
- `id`: 子用户ID
- `username`: 用户名
- `realName`: 真实姓名

#### archives 字段
- `id`: 档案ID
- `archiveName`: 档案名称
- `activity`: 活跃度（high, medium, low, inactive）
- `photoCount`: 照片数量
- `bodyPart`: 检测部位（fingerprint, face, iris, voice）
- `detectionTime`: 检测时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### pagination 字段
- `page`: 当前页码
- `limit`: 每页数量
- `total`: 总数量
- `totalPages`: 总页数

---

## 2. 创建档案

### 接口信息

- **方法**: `POST`
- **路径**: `/api/miniprogram/archives`
- **描述**: 为指定用户创建新档案

### 请求参数

```json
{
  "username": "subuser001",
  "archiveName": "新档案",
  "bodyPart": "fingerprint",
  "activity": "high",
  "photoCount": 5
}
```

### 请求字段说明

- `username`: 用户名（必填）
- `archiveName`: 档案名称（必填，2-50个字符）
- `bodyPart`: 检测部位（可选，默认fingerprint）
- `activity`: 活跃度（可选，默认medium）
- `photoCount`: 照片数量（可选，默认0）

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "cmdw3r532000splzxlhr67jtc",
    "subUserId": "cmdw3r532000splzxlhr67jtc",
    "archiveName": "新档案",
    "bodyPart": "fingerprint",
    "activity": "high",
    "photoCount": 5,
    "detectionTime": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "档案创建成功",
  "code": 200
}
```

---

## 错误响应

### 常见错误码

- `400`: 请求参数错误
- `401`: 认证失败
- `404`: 用户不存在
- `500`: 服务器内部错误

### 错误响应示例

```json
{
  "success": false,
  "data": null,
  "message": "请提供用户名参数",
  "code": 400
}
```

---

## 前端调用示例

### JavaScript 示例

```javascript
// 获取档案列表
async function getArchives(username, page = 1, limit = 10) {
  try {
    const response = await fetch(`/api/miniprogram/archives?username=${username}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('档案列表:', result.data.archives)
      console.log('用户信息:', result.data.subUser)
      console.log('分页信息:', result.data.pagination)
    } else {
      console.error('获取失败:', result.message)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 创建档案
async function createArchive(archiveData) {
  try {
    const response = await fetch('/api/miniprogram/archives', {
      method: 'POST',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(archiveData)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('创建成功:', result.data)
    } else {
      console.error('创建失败:', result.message)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 使用示例
getArchives('subuser001')

createArchive({
  username: 'subuser001',
  archiveName: '新档案',
  bodyPart: 'fingerprint',
  activity: 'high',
  photoCount: 5
})
```

### 微信小程序示例

```javascript
// 获取档案列表
wx.request({
  url: 'https://your-domain.com/api/miniprogram/archives',
  method: 'GET',
  data: {
    username: 'subuser001',
    page: 1,
    limit: 10
  },
  header: {
    'X-Openid': wx.getStorageSync('openid')
  },
  success: function(res) {
    if (res.data.success) {
      console.log('档案列表:', res.data.data.archives)
      console.log('用户信息:', res.data.data.subUser)
    } else {
      console.error('获取失败:', res.data.message)
    }
  },
  fail: function(error) {
    console.error('请求失败:', error)
  }
})

// 创建档案
wx.request({
  url: 'https://your-domain.com/api/miniprogram/archives',
  method: 'POST',
  header: {
    'X-Openid': wx.getStorageSync('openid'),
    'Content-Type': 'application/json'
  },
  data: {
    username: 'subuser001',
    archiveName: '新档案',
    bodyPart: 'fingerprint',
    activity: 'high',
    photoCount: 5
  },
  success: function(res) {
    if (res.data.success) {
      console.log('创建成功:', res.data.data)
    } else {
      console.error('创建失败:', res.data.message)
    }
  },
  fail: function(error) {
    console.error('请求失败:', error)
  }
})
```

---

## 业务逻辑说明

### 1. 用户验证
- 接口首先根据 openid 和用户名找到对应的子用户
- 确保只有该微信用户下的子用户才能访问档案
- 防止跨用户访问档案信息

### 2. 档案唯一性
- 同一子用户下的档案名称必须唯一
- 创建档案时会自动检查重复

### 3. 统计数据更新
- 创建档案时会自动更新子用户的档案数量
- 保持统计数据的一致性

### 4. 分页支持
- 支持分页查询，避免数据量过大
- 返回完整的分页信息

---

## 注意事项

1. **认证要求**: 所有接口都需要提供有效的 `X-Openid` 头部
2. **用户权限**: 只能访问自己微信用户下的子用户档案
3. **档案名称**: 同一子用户下的档案名称必须唯一
4. **数据限制**: 档案名称有长度限制（2-50个字符）
5. **自动统计**: 创建档案时会自动更新用户的档案数量 