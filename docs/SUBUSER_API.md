# 子用户管理 API 文档

## 概述

子用户管理API提供了对微信用户下子用户的完整管理功能，包括创建、查询、更新等操作。

## 接口列表

### 1. 获取子用户列表

**接口地址**: `GET /api/miniprogram/users`

**功能描述**: 获取当前微信用户下的所有子用户列表

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取子用户列表成功",
  "data": [
    {
      "id": "subuser_123",
      "username": "张三",
      "realName": "张三",
      "phone": "138****8888",
      "email": "zhangsan@example.com",
      "age": 25,
      "gender": "1",
      "address": "北京市朝阳区",
      "status": "active",
      "archives": 5,
      "photos": 10,
      "reports": 2,
      "remark": "备注信息",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 创建子用户

**接口地址**: `POST /api/miniprogram/users`

**功能描述**: 创建新的子用户

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```json
{
  "username": "张三",        // 必填，用户名，2-20个字符
  "realName": "张三",        // 必填，真实姓名，2-10个字符
  "phone": "13888888888",    // 可选，手机号
  "email": "zhangsan@example.com", // 可选，邮箱
  "age": 25,                 // 可选，年龄
  "gender": "1",             // 可选，性别：1-男，2-女，0-未知
  "address": "北京市朝阳区",  // 可选，地址
  "remark": "备注信息"        // 可选，备注
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "子用户创建成功",
  "data": {
    "id": "subuser_123",
    "username": "张三",
    "realName": "张三",
    "phone": "138****8888",
    "email": "zhangsan@example.com",
    "age": 25,
    "gender": "1",
    "address": "北京市朝阳区",
    "status": "active",
    "archives": 0,
    "photos": 0,
    "reports": 0,
    "remark": "备注信息",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 获取单个子用户信息

**接口地址**: `GET /api/miniprogram/subusers/{id}`

**功能描述**: 获取指定子用户的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 子用户ID

**响应示例**:
```json
{
  "success": true,
  "message": "获取子用户信息成功",
  "data": {
    "id": "subuser_123",
    "username": "张三",
    "realName": "张三",
    "phone": "138****8888",
    "email": "zhangsan@example.com",
    "age": 25,
    "gender": "1",
    "address": "北京市朝阳区",
    "status": "active",
    "archives": 5,
    "photos": 10,
    "reports": 2,
    "remark": "备注信息",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 更新子用户信息

**接口地址**: `PUT /api/miniprogram/subusers/{id}`

**功能描述**: 更新指定子用户的信息

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `id`: 子用户ID

**请求参数**:
```json
{
  "username": "张三",        // 必填，用户名，2-20个字符
  "realName": "张三",        // 可选，真实姓名，2-10个字符
  "phone": "13888888888",    // 可选，手机号
  "email": "zhangsan@example.com", // 可选，邮箱
  "age": 25,                 // 可选，年龄，1-120岁
  "gender": "1",             // 可选，性别：1-男，2-女，0-未知
  "address": "北京市朝阳区",  // 可选，地址
  "remark": "备注信息"        // 可选，备注
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "子用户信息更新成功",
  "data": {
    "id": "subuser_123",
    "username": "张三",
    "realName": "张三",
    "phone": "138****8888",
    "email": "zhangsan@example.com",
    "age": 25,
    "gender": "1",
    "address": "北京市朝阳区",
    "status": "active",
    "archives": 5,
    "photos": 10,
    "reports": 2,
    "remark": "备注信息",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 5. 删除子用户

**接口地址**: `DELETE /api/miniprogram/subusers/{id}`

**功能描述**: 删除指定的子用户（软删除）

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 子用户ID

**响应示例**:
```json
{
  "success": true,
  "message": "子用户删除成功",
  "data": {
    "id": "subuser_123",
    "username": "张三",
    "realName": "张三",
    "status": "inactive",
    "deletedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**删除限制**:
- 不能删除本人的默认用户
- 不能删除有关联数据的子用户（档案、检测记录、反馈等）

## 数据验证规则

### 用户名 (username)
- 必填字段
- 长度：2-20个字符
- 在同一微信用户下必须唯一

### 真实姓名 (realName)
- 可选字段
- 长度：2-10个字符（如果提供）

### 手机号 (phone)
- 可选字段
- 示例：13888888888

### 邮箱 (email)
- 可选字段
- 格式：标准邮箱格式
- 示例：user@example.com

### 年龄 (age)
- 可选字段
- 范围：1-120岁
- 类型：整数

### 性别 (gender)
- 可选字段
- 值：0-未知，1-男，2-女
- 类型：字符串

## 错误码说明

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 用户名为必填项 | 缺少必填字段 |
| 400 | 用户名长度应在2-20个字符之间 | 用户名长度不符合要求 |
| 400 | 真实姓名长度应在2-10个字符之间 | 真实姓名长度不符合要求 |

| 400 | 邮箱格式不正确 | 邮箱格式错误 |
| 400 | 年龄应在1-120岁之间 | 年龄范围错误 |
| 400 | 用户名已存在 | 用户名重复 |
| 400 | 不能删除本人的默认用户 | 删除操作被限制 |
| 400 | 该子用户有关联的档案、检测记录或反馈，无法删除 | 删除操作被限制 |
| 401 | 未授权访问 | 缺少或无效的认证token |
| 404 | 子用户不存在或无权限访问 | 子用户不存在或不属于当前用户 |
| 500 | 服务器内部错误 | 系统错误 |

## 注意事项

1. **权限控制**: 用户只能操作自己微信账号下的子用户
2. **数据脱敏**: 手机号在返回时会自动脱敏处理
3. **状态管理**: 只返回状态为 'active' 的子用户
4. **唯一性**: 用户名在同一微信用户下必须唯一
5. **数据完整性**: 更新操作会验证所有字段的格式和范围
6. **删除限制**: 
   - 不能删除本人的默认用户（用户名或真实姓名与微信昵称相同的用户）
   - 不能删除有关联数据的子用户（档案、检测记录、反馈等）
   - 删除操作为软删除，将状态设置为 'inactive' 