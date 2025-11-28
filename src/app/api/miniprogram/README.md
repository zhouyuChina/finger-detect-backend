# 微信小程序接口文档

## 基础信息

- **基础URL**: `https://your-domain.com/api/miniprogram`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 统一响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

## 接口列表

### 1. 用户认证

#### 1.1 微信登录
- **接口**: `POST /auth`
- **描述**: 使用微信登录code获取用户token
- **请求参数**:
  ```json
  {
    "code": "微信登录code"
  }
  ```
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token",
      "openid": "user_openid",
      "userInfo": {
        "id": 1,
        "nickname": "微信用户",
        "avatar": ""
      }
    }
  }
  ```

### 2. 用户信息

#### 2.1 获取用户信息
- **接口**: `GET /user`
- **认证**: 需要Bearer Token
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "nickname": "微信用户",
      "avatar": "",
      "phone": "138****8888",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 2.2 更新用户信息
- **接口**: `PUT /user`
- **认证**: 需要Bearer Token
- **请求参数**:
  ```json
  {
    "nickname": "新昵称",
    "avatar": "头像URL",
    "phone": "手机号"
  }
  ```

### 3. 优惠券管理

#### 3.1 获取当前用户拥有的优惠券信息
- **接口**: `GET /coupons`
- **认证**: 需要Bearer Token
- **请求参数**:
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
  - `status`: 状态筛选（可选，used/unused/expired）
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": "user_coupon_id",
          "couponId": "coupon_id",
          "isUsed": false,
          "status": "unused",
          "coupon": {
            "id": "coupon_id",
            "name": "新用户专享券",
            "type": "discount",
            "value": 10,
            "minAmount": 50,
            "startTime": "2024-01-01T00:00:00Z",
            "endTime": "2024-12-31T23:59:59Z",
            "isExpired": false,
            "isActive": true
          }
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 50,
        "totalPages": 5
      }
    }
  }
  ```

### 4. 文件上传

#### 4.1 上传文件
- **接口**: `POST /upload`
- **认证**: 需要Bearer Token
- **请求方式**: `multipart/form-data`
- **参数**:
  - `file`: 文件对象
- **限制**:
  - 文件类型: jpg, png, gif, webp
  - 文件大小: 最大5MB
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "url": "/uploads/filename.jpg",
      "fileName": "filename.jpg",
      "size": 1024,
      "type": "image/jpeg"
    }
  }
  ```

### 4. 关于我们

#### 4.1 获取关于我们信息
- **接口**: `GET /about`
- **认证**: 需要Bearer Token 或 x-openid header
- **描述**: 获取公司基本信息和应用版本信息
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "name": "指甲检测系统",
      "logo": "/uploads/logo.png",
      "description": "专业的指甲检测服务提供商",
      "address": "北京市朝阳区xxx街道xxx号",
      "phone": "400-123-4567",
      "email": "contact@example.com",
      "website": "https://www.example.com",
      "wechat": "wechat_id",
      "version": "1.0.0",
      "copyright": "© 2024 指甲检测系统. All rights reserved."
    },
    "message": "获取关于我们信息成功",
    "code": 200
  }
  ```

### 5. 检测记录

#### 5.1 获取检测记录列表
- **接口**: `GET /detection`
- **认证**: 需要Bearer Token
- **查询参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认10)
  - `userId`: 用户ID (可选)
- **响应示例**:
  ```json
  {
    "success": true,
    "data": {
      "list": [
        {
          "id": 1,
          "userId": 1,
          "archiveName": "档案1",
          "detectionType": "fingerprint",
          "result": "normal",
          "confidence": 0.95,
          "imageUrl": "/uploads/detection1.jpg",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

#### 5.2 创建检测记录
- **接口**: `POST /detection`
- **认证**: 需要Bearer Token
- **请求参数**:
  ```json
  {
    "archiveName": "档案名称",
    "detectionType": "fingerprint",
    "imageUrl": "图片URL",
    "result": "检测结果",
    "confidence": 0.95
  }
  ```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### JavaScript 示例

```javascript
// 登录
const login = async (code) => {
  const response = await fetch('/api/miniprogram/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  })
  const result = await response.json()
  if (result.success) {
    // 保存token
    wx.setStorageSync('token', result.data.token)
  }
}

// 获取用户信息
const getUserInfo = async () => {
  const token = wx.getStorageSync('token')
  const response = await fetch('/api/miniprogram/user', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return await response.json()
}

// 上传文件
const uploadFile = async (filePath) => {
  const token = wx.getStorageSync('token')
  const formData = new FormData()
  formData.append('file', filePath)
  
  const response = await fetch('/api/miniprogram/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  return await response.json()
}

// 获取关于我们信息
const getAboutInfo = async () => {
  const token = wx.getStorageSync('token')
  const response = await fetch('/api/miniprogram/about', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return await response.json()
}

// 使用 openid 获取关于我们信息
const getAboutInfoWithOpenid = async (openid) => {
  const response = await fetch('/api/miniprogram/about', {
    headers: {
      'x-openid': openid
    }
  })
  return await response.json()
}
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. 文件上传接口使用 `multipart/form-data` 格式
3. 响应数据统一使用 JSON 格式
4. 错误响应会包含错误码和错误信息
5. 建议在微信小程序中实现token自动刷新机制 