# 用户管理接口文档

## 概述

用户管理接口用于在微信小程序中管理当前微信用户下的所有子用户信息。

**基础路径**: `/api/miniprogram/users`

**认证方式**: 需要微信小程序认证（X-Openid 头部）

---

## 1. 获取子用户列表

### 接口信息

- **方法**: `GET`
- **路径**: `/api/miniprogram/users`
- **描述**: 获取当前微信用户下的所有子用户信息

### 请求参数

无参数

### 请求头

```
X-Openid: {openid}  // 微信用户的 openid
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "wechatUser": {
      "id": "cmdw1oroa0000s67p1qi5qc1i",
      "openid": "test_openid_001",
      "nickname": "测试微信用户1",
      "avatar": "https://example.com/avatar1.jpg",
      "avatarUrl": "https://example.com/avatar1.jpg",
      "gender": "1",
      "city": "深圳",
      "province": "广东",
      "country": "中国",
      "status": "active",
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "registerTime": "2024-01-01T00:00:00.000Z"
    },
    "subUsers": [
      {
        "id": "cmdw1oroa0000s67p1qi5qc1j",
        "username": "subuser001",
        "realName": "张三",
        "phone": "138****8001",
        "email": "zhangsan@example.com",
        "age": 25,
        "gender": "1",
        "address": "广东省深圳市南山区",
        "status": "active",
        "archives": 5,
        "photos": 10,
        "reports": 3,
        "remark": "备注信息",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCount": 1,
    "currentSubUser": {
      "id": "cmdw1oroa0000s67p1qi5qc1j",
      "username": "subuser001",
      "realName": "张三"
    }
  },
  "message": "获取子用户列表成功",
  "code": 200
}
```

### 响应字段说明

#### wechatUser 字段
- `id`: 微信用户ID
- `openid`: 微信openid
- `nickname`: 微信昵称
- `avatar`: 微信头像
- `avatarUrl`: 头像URL（兼容字段）
- `gender`: 性别（1-男，2-女，0-未知）
- `city`: 城市
- `province`: 省份
- `country`: 国家
- `status`: 状态
- `lastLogin`: 最后登录时间
- `registerTime`: 注册时间

#### subUsers 字段
- `id`: 子用户ID
- `username`: 用户名
- `realName`: 真实姓名
- `phone`: 手机号（已脱敏）
- `email`: 邮箱
- `age`: 年龄
- `gender`: 性别
- `address`: 地址
- `status`: 状态
- `archives`: 档案数量
- `photos`: 照片数量
- `reports`: 报告数量
- `remark`: 备注
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### 其他字段
- `totalCount`: 子用户总数
- `currentSubUser`: 当前选中的子用户信息

---

## 2. 创建子用户

### 接口信息

- **方法**: `POST`
- **路径**: `/api/miniprogram/users`
- **描述**: 为当前微信用户创建新的子用户

### 请求参数

```json
{
  "username": "subuser001",
  "realName": "张三",
  "phone": "13800138001",
  "email": "zhangsan@example.com",
  "age": 25,
  "gender": "1",
  "address": "广东省深圳市南山区",
  "remark": "备注信息"
}
```

### 请求字段说明

- `username`: 用户名（必填，2-20个字符）
- `realName`: 真实姓名（必填，2-10个字符）
- `phone`: 手机号（可选，11位数字）
- `email`: 邮箱（可选，标准邮箱格式）
- `age`: 年龄（可选，数字）
- `gender`: 性别（可选，1-男，2-女）
- `address`: 地址（可选）
- `remark`: 备注（可选）

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "cmdw1oroa0000s67p1qi5qc1j",
    "username": "subuser001",
    "realName": "张三",
    "phone": "138****8001",
    "email": "zhangsan@example.com",
    "age": 25,
    "gender": "1",
    "address": "广东省深圳市南山区",
    "status": "active",
    "remark": "备注信息",
    "archives": 0,
    "photos": 0,
    "reports": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "子用户创建成功",
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
  "message": "用户名和真实姓名为必填项",
  "code": 400
}
```

---

## 前端调用示例

### JavaScript 示例

```javascript
// 获取子用户列表
async function getSubUsers() {
  try {
    const response = await fetch('/api/miniprogram/users', {
      method: 'GET',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('子用户列表:', result.data.subUsers)
      console.log('当前子用户:', result.data.currentSubUser)
    } else {
      console.error('获取失败:', result.message)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 创建子用户
async function createSubUser(userData) {
  try {
    const response = await fetch('/api/miniprogram/users', {
      method: 'POST',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
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
getSubUsers()

createSubUser({
  username: 'newuser',
  realName: '新用户',
  phone: '13800138000',
  email: 'newuser@example.com',
  age: 30,
  gender: '1',
  address: '广东省深圳市',
  remark: '新创建的用户'
})
```

### 微信小程序示例

```javascript
// 获取子用户列表
wx.request({
  url: 'https://your-domain.com/api/miniprogram/users',
  method: 'GET',
  header: {
    'X-Openid': wx.getStorageSync('openid')
  },
  success: function(res) {
    if (res.data.success) {
      console.log('子用户列表:', res.data.data.subUsers)
    } else {
      console.error('获取失败:', res.data.message)
    }
  },
  fail: function(error) {
    console.error('请求失败:', error)
  }
})

// 创建子用户
wx.request({
  url: 'https://your-domain.com/api/miniprogram/users',
  method: 'POST',
  header: {
    'X-Openid': wx.getStorageSync('openid'),
    'Content-Type': 'application/json'
  },
  data: {
    username: 'newuser',
    realName: '新用户',
    phone: '13800138000',
    email: 'newuser@example.com',
    age: 30,
    gender: '1',
    address: '广东省深圳市',
    remark: '新创建的用户'
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

## 注意事项

1. **认证要求**: 所有接口都需要提供有效的 `X-Openid` 头部
2. **用户名唯一性**: 同一微信用户下的子用户名必须唯一
3. **手机号脱敏**: 返回的手机号会自动脱敏处理
4. **状态过滤**: 只返回状态为 `active` 的子用户
5. **数据限制**: 用户名和真实姓名有长度限制
6. **格式验证**: 手机号和邮箱会进行格式验证 