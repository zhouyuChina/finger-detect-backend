# 档案管理API文档

## 概述
档案管理API用于管理用户的检测档案，包括获取档案列表和创建新档案。档案是一个持续更新的记录集合，包含多次检测记录。

## 基础信息
- **基础URL**: `/api/miniprogram/archives`
- **认证方式**: 微信小程序认证（x-openid header）
- **数据格式**: JSON

## API接口

### 1. 获取档案列表

#### 请求信息
- **方法**: `GET`
- **URL**: `/api/miniprogram/archives`
- **认证**: 需要 `x-openid` header

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名（需要URL编码） |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

#### 响应格式
```json
{
  "success": true,
  "data": {
    "subUser": {
      "id": "string",
      "username": "string",
      "realName": "string"
    },
    "archives": [
      {
        "id": "string",
        "archiveName": "string",
        "status": "string",
        "totalDetections": "number",
        "bodyPart": "string",
        "startDate": "string",
        "lastDetectionTime": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "imageUrl": "string",
        "result": "string",
        "confidence": "number",
        "latestDetectionTime": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number"
    }
  },
  "message": "获取档案列表成功",
  "code": 200
}
```

#### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| subUser | object | 子用户信息 |
| archives | array | 档案列表 |
| archives[].id | string | 档案ID |
| archives[].archiveName | string | 档案名称 |
| archives[].status | string | 档案状态：active, completed, cancelled |
| archives[].totalDetections | number | 总检测次数 |
| archives[].bodyPart | string | 检测部位 |
| archives[].startDate | string | 开始日期 |
| archives[].lastDetectionTime | string | 最后检测时间 |
| archives[].imageUrl | string | 最新检测图片URL |
| archives[].result | string | 最新检测结果：normal, abnormal |
| archives[].confidence | number | 最新检测置信度 |
| archives[].latestDetectionTime | string | 最新检测时间 |

### 2. 创建新档案

#### 请求信息
- **方法**: `POST`
- **URL**: `/api/miniprogram/archives`
- **认证**: 需要 `x-openid` header
- **Content-Type**: `application/json`

#### 请求体
```json
{
  "username": "string",
  "archiveName": "string",
  "bodyPart": "string",
  "imageUrl": "string"
}
```

#### 请求字段说明
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| archiveName | string | 是 | 档案名称 |
| bodyPart | string | 是 | 检测部位，可选值：left_hand_thumb, left_hand_index, left_hand_middle, left_hand_ring, left_hand_little, right_hand_thumb, right_hand_index, right_hand_middle, right_hand_ring, right_hand_little, left_foot_big, left_foot_second, left_foot_third, left_foot_fourth, left_foot_little, right_foot_big, right_foot_second, right_foot_third, right_foot_fourth, right_foot_little |
| imageUrl | string | 是 | 检测图片URL，必须以http://、https://或/uploads/开头 |

#### 响应格式
```json
{
  "success": true,
  "data": {
    "archive": {
      "id": "string",
      "subUserId": "string",
      "archiveName": "string",
      "bodyPart": "string",
      "status": "string",
      "startDate": "string",
      "totalDetections": "number",
      "createdAt": "string",
      "updatedAt": "string"
    },
    "detection": {
      "id": "string",
      "archiveId": "string",
      "detectionType": "string",
      "imageUrl": "string",
      "result": "string",
      "confidence": "number",
      "status": "string",
      "detectionTime": "string",
      "createdAt": "string"
    }
  },
  "message": "档案创建成功",
  "code": 200
}
```

## 错误响应

### 常见错误码
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 404 | 用户不存在或无权限访问 |
| 409 | 档案名称已存在 |
| 500 | 服务器内部错误 |

### 错误响应格式
```json
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "code": 400
}
```

## 业务逻辑说明

### 档案管理
1. **档案结构**: 每个档案包含基本信息（名称、部位、状态等）和关联的检测记录
2. **检测记录**: 每个档案可以有多个检测记录，API会返回最新的检测记录信息
3. **状态管理**: 档案状态从"active"开始，治疗完成后可标记为"completed"
4. **图片关联**: 档案列表会显示最新检测记录的图片URL和结果
5. **持续更新**: 档案是一个持续更新的记录集合，用户可以不断添加新的检测记录

### 创建档案流程
1. 验证用户权限和参数
2. 检查档案名称是否重复
3. 同时创建档案记录和初始检测记录
4. 更新档案统计信息（总检测次数、最后检测时间）
5. 更新用户统计信息
6. 返回档案和检测记录信息

## 测试数据

### 测试用户
- **OpenID**: `test_openid_123`
- **用户名**: `测试用户`

### 测试档案
- **左手食指**: 2次检测记录
- **右手拇指**: 1次检测记录
- **右脚大拇指**: 1次检测记录（新创建）

### 测试命令
```bash
# 获取档案列表（注意URL编码）
curl -X GET "http://localhost:3001/api/miniprogram/archives?username=%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7" \
  -H "x-openid: test_openid_123"

# 创建新档案
curl -X POST "http://localhost:3001/api/miniprogram/archives" \
  -H "x-openid: test_openid_123" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "测试用户",
    "archiveName": "右脚大拇指",
    "bodyPart": "right_foot_big",
    "imageUrl": "http://example.com/images/右脚大拇指_1.jpg"
  }'
```

## 注意事项

1. **URL编码**: 中文用户名需要使用URL编码，例如"测试用户"编码为"%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7"
2. **图片URL格式**: 新增档案时的imageUrl必须以http://、https://或/uploads/开头
3. **档案名称唯一性**: 同一用户下的档案名称必须唯一
4. **检测部位**: bodyPart字段必须使用预定义的检测部位值 