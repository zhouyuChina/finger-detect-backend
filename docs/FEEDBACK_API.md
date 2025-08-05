# 微信小程序反馈API文档

## 概述

本文档描述了微信小程序中反馈功能的相关API接口。所有接口都需要微信小程序认证，用户只能访问自己的反馈数据。

## 基础信息

- **基础URL**: `http://localhost:3001/api/miniprogram/feedback`
- **认证方式**: 微信小程序认证中间件
- **数据格式**: JSON

## 接口列表

### 1. 提交反馈

**接口地址**: `POST /api/miniprogram/feedback`

**功能描述**: 用户提交新的反馈

**请求参数**:
```json
{
  "type": "bug",           // 反馈类型：bug(问题)、suggestion(建议)、complaint(投诉)
  "title": "标题",         // 反馈标题，最大100字符
  "content": "详细内容",   // 反馈内容，最大1000字符
  "images": ["url1", "url2"] // 图片URL数组，最多5张（可选）
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "反馈提交成功，我们会尽快处理",
  "data": {
    "id": "feedback_id",
    "type": "bug",
    "title": "标题",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 获取反馈列表

**接口地址**: `GET /api/miniprogram/feedback`

**功能描述**: 获取当前用户的反馈列表

**查询参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `status`: 状态筛选（可选）：pending、processing、completed、rejected
- `type`: 类型筛选（可选）：bug、suggestion、complaint

**响应示例**:
```json
{
  "success": true,
  "message": "获取反馈列表成功",
  "data": {
    "list": [
      {
        "id": "feedback_id",
        "type": "bug",
        "typeText": "问题反馈",
        "title": "标题",
        "content": "详细内容",
        "images": ["url1", "url2"],
        "status": "pending",
        "statusText": "待处理",
        "reply": "回复内容",
        "repliedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3. 获取反馈详情

**接口地址**: `GET /api/miniprogram/feedback/{id}`

**功能描述**: 获取指定反馈的详细信息

**路径参数**:
- `id`: 反馈ID

**响应示例**:
```json
{
  "success": true,
  "message": "获取反馈详情成功",
  "data": {
    "id": "feedback_id",
    "type": "bug",
    "typeText": "问题反馈",
    "title": "标题",
    "content": "详细内容",
    "images": ["url1", "url2"],
    "status": "pending",
    "statusText": "待处理",
    "reply": "回复内容",
    "repliedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```



## 数据字段说明

### 反馈类型 (type)
- `bug`: 问题反馈
- `suggestion`: 功能建议
- `complaint`: 投诉建议

### 反馈状态 (status)
- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `rejected`: 已拒绝

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 404 | 资源不存在 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |

## 使用示例

### 提交反馈
```javascript
// 微信小程序中调用
wx.request({
  url: 'http://localhost:3001/api/miniprogram/feedback',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  data: {
    type: 'bug',
    title: '应用崩溃问题',
    content: '在使用过程中应用突然崩溃了',
    images: ['https://example.com/image1.jpg']
  },
  success: function(res) {
    console.log('反馈提交成功:', res.data);
  }
});
```

### 获取反馈列表
```javascript
wx.request({
  url: 'http://localhost:3001/api/miniprogram/feedback?page=1&pageSize=10&status=pending',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + token
  },
  success: function(res) {
    console.log('反馈列表:', res.data);
  }
});
```

## 注意事项

1. 所有接口都需要微信小程序认证
2. 用户只能访问自己的反馈数据
3. 图片上传需要先调用上传接口获取URL
4. 反馈提交后状态默认为"待处理"
5. 管理员可以在后台回复反馈，回复后状态会更新 