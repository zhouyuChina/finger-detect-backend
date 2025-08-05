# 系统消息 API 文档

## 概述

系统消息API提供了微信小程序获取系统消息的功能，包括消息列表、消息详情和未读消息数量等。

## 接口列表

### 1. 获取系统消息列表

**接口地址**: `GET /api/miniprogram/system-messages`

**功能描述**: 获取系统消息列表，支持分页和类型过滤

**请求头**:
```
Authorization: Bearer <token>
x-openid: <openid>
```

**查询参数**:
- `page` (可选): 页码，默认为1
- `limit` (可选): 每页数量，默认为10
- `type` (可选): 消息类型过滤
- `status` (可选): 消息状态，默认为 'published'

**响应示例**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "title": "系统维护通知",
        "content": "系统将于今晚进行维护升级...",
        "type": "maintenance_notice",
        "status": "published",
        "readCount": 150,
        "totalCount": 200,
        "publishedAt": "2024-01-01T10:00:00.000Z",
        "createdAt": "2024-01-01T09:00:00.000Z",
        "updatedAt": "2024-01-01T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "获取系统消息成功",
  "code": 200
}
```

### 2. 获取系统消息详情

**接口地址**: `GET /api/miniprogram/system-messages/{id}`

**功能描述**: 获取单个系统消息的详细信息，并增加阅读次数

**请求头**:
```
Authorization: Bearer <token>
x-openid: <openid>
```

**路径参数**:
- `id`: 系统消息ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "msg_123",
    "title": "系统维护通知",
    "content": "系统将于今晚进行维护升级，预计维护时间为2小时...",
    "type": "maintenance_notice",
    "status": "published",
    "readCount": 151,
    "totalCount": 200,
    "publishedAt": "2024-01-01T10:00:00.000Z",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T09:00:00.000Z"
  },
  "message": "获取系统消息详情成功",
  "code": 200
}
```

### 3. 获取未读系统消息数量

**接口地址**: `GET /api/miniprogram/system-messages/unread-count`

**功能描述**: 获取未读系统消息的数量

**请求头**:
```
Authorization: Bearer <token>
x-openid: <openid>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  },
  "message": "获取未读系统消息数量成功",
  "code": 200
}
```

## 消息类型说明

| 类型 | 说明 |
|------|------|
| `system_notice` | 系统通知 |
| `activity_announcement` | 活动公告 |
| `feature_update` | 功能更新 |
| `maintenance_notice` | 维护通知 |
| `security_alert` | 安全提醒 |

## 消息状态说明

| 状态 | 说明 |
|------|------|
| `draft` | 草稿 |
| `published` | 已发布 |
| `expired` | 已过期 |
| `cancelled` | 已取消 |

## 数据字段说明

### 消息对象字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 消息ID |
| `title` | string | 消息标题 |
| `content` | string | 消息内容 |
| `type` | string | 消息类型 |
| `status` | string | 消息状态 |
| `readCount` | number | 阅读次数 |
| `totalCount` | number | 总次数 |
| `publishedAt` | string | 发布时间 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

### 分页对象字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `page` | number | 当前页码 |
| `limit` | number | 每页数量 |
| `total` | number | 总数量 |
| `totalPages` | number | 总页数 |

## 错误码说明

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 缺少消息ID | 缺少必要参数 |
| 401 | 未授权访问 | 缺少或无效的认证token |
| 404 | 系统消息不存在或未发布 | 消息不存在或状态不正确 |
| 500 | 服务器内部错误 | 系统错误 |

## 使用示例

### JavaScript 示例

```javascript
// 获取系统消息列表
const getSystemMessages = async () => {
  const response = await fetch('/api/miniprogram/system-messages?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'x-openid': 'test_openid'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('系统消息:', result.data.messages);
  }
};

// 获取系统消息详情
const getSystemMessageDetail = async (messageId) => {
  const response = await fetch(`/api/miniprogram/system-messages/${messageId}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'x-openid': 'test_openid'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('消息详情:', result.data);
  }
};

// 获取未读消息数量
const getUnreadCount = async () => {
  const response = await fetch('/api/miniprogram/system-messages/unread-count', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'x-openid': 'test_openid'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('未读数量:', result.data.unreadCount);
  }
};
```

### cURL 示例

```bash
# 获取系统消息列表
curl -X GET "http://localhost:3001/api/miniprogram/system-messages?page=1&limit=10" \
  -H "x-openid: test_openid"

# 获取系统消息详情
curl -X GET "http://localhost:3001/api/miniprogram/system-messages/msg_123" \
  -H "x-openid: test_openid"

# 获取未读消息数量
curl -X GET "http://localhost:3001/api/miniprogram/system-messages/unread-count" \
  -H "x-openid: test_openid"
```

## 注意事项

1. **认证要求**: 所有接口都需要微信小程序认证
2. **阅读统计**: 获取消息详情时会自动增加阅读次数
3. **状态过滤**: 默认只返回已发布的消息
4. **分页支持**: 消息列表支持分页查询
5. **类型过滤**: 支持按消息类型进行过滤
6. **时间格式**: 所有时间字段使用ISO 8601格式 