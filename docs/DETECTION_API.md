# 检测管理接口文档

## 概述

检测管理接口用于在微信小程序中进行生物特征检测，包括调用第三方检测服务、存储检测结果和获取检测记录。

**基础路径**: `/api/miniprogram/detection`

**认证方式**: 需要微信小程序认证（X-Openid 头部）

---

## 1. 获取检测记录列表

### 接口信息

- **方法**: `GET`
- **路径**: `/api/miniprogram/detection`
- **描述**: 获取指定用户的检测记录列表

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
GET /api/miniprogram/detection?username=subuser001&page=1&limit=10
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
    "detections": [
      {
        "id": "cmdw3r532000splzxlhr67jtc",
        "archiveName": "张三检测1",
        "detectionType": "fingerprint",
        "imageUrl": "https://example.com/image.jpg",
        "result": "normal",
        "confidence": 0.89,
        "status": "completed",
        "errorMsg": null,
        "remark": "检测类型: fingerprint, 置信度: 0.89",
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
  "message": "获取检测记录成功",
  "code": 200
}
```

### 响应字段说明

#### subUser 字段
- `id`: 子用户ID
- `username`: 用户名
- `realName`: 真实姓名

#### detections 字段
- `id`: 检测记录ID
- `archiveName`: 档案名称
- `detectionType`: 检测类型（fingerprint, face, iris, voice）
- `imageUrl`: 图片URL
- `result`: 检测结果（normal, abnormal）
- `confidence`: 置信度（0-1）
- `status`: 状态（completed, processing, failed）
- `errorMsg`: 错误信息
- `remark`: 备注
- `detectionTime`: 检测时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

#### pagination 字段
- `page`: 当前页码
- `limit`: 每页数量
- `total`: 总数量
- `totalPages`: 总页数

---

## 2. 创建检测记录

### 接口信息

- **方法**: `POST`
- **路径**: `/api/miniprogram/detection`
- **描述**: 创建新的检测记录，调用第三方检测服务

### 请求参数

```json
{
  "username": "subuser001",
  "archiveName": "新检测",
  "detectionType": "fingerprint",
  "imageUrl": "https://example.com/image.jpg"
}
```

### 请求字段说明

- `username`: 用户名（必填）
- `archiveName`: 档案名称（必填）
- `detectionType`: 检测类型（可选，默认fingerprint）
- `imageUrl`: 图片URL（必填）

### 支持的检测类型

- `fingerprint`: 指纹检测
- `face`: 面部检测
- `iris`: 虹膜检测
- `voice`: 语音检测

### 响应示例

```json
{
  "success": true,
  "data": {
    "detection": {
      "id": "cmdw3r532000splzxlhr67jtc",
      "archiveName": "新检测",
      "detectionType": "fingerprint",
      "imageUrl": "https://example.com/image.jpg",
      "result": "normal",
      "confidence": 0.89,
      "status": "completed",
      "remark": "检测类型: fingerprint, 置信度: 0.89",
      "detectionTime": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "thirdPartyResult": {
      "imageUrl": "https://example.com/image.jpg",
      "description": "指纹检测结果正常，指纹纹路清晰，无异常特征。",
      "suggestion": "建议保持良好的手部卫生，定期清洁指纹采集设备。",
      "result": "normal",
      "confidence": 0.89,
      "detectionType": "fingerprint",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "检测完成",
  "code": 200
}
```

### 第三方检测结果字段说明

#### thirdPartyResult 字段
- `imageUrl`: 检测的图片URL
- `description`: 检测结果描述
- `suggestion`: 产品使用建议
- `result`: 检测结果（normal, abnormal）
- `confidence`: 置信度（0-1）
- `detectionType`: 检测类型
- `timestamp`: 检测时间戳

---

## 第三方检测服务说明

### Mock 服务特点

当前使用 Mock 第三方检测服务，具有以下特点：

1. **模拟网络延迟**: 1-3秒随机延迟
2. **智能结果生成**: 根据检测类型生成不同的结果
3. **真实概率分布**: 70% 正常结果，30% 异常结果
4. **置信度模拟**: 正常结果置信度较高（0.85-0.95），异常结果置信度较低（0.6-0.8）

### 检测类型对应的结果

#### 指纹检测 (fingerprint)
- **正常**: "指纹检测结果正常，指纹纹路清晰，无异常特征。"
- **异常**: "检测到指纹异常，可能存在磨损、疤痕或其他特征变化。"

#### 面部检测 (face)
- **正常**: "面部检测结果正常，面部特征完整，无异常发现。"
- **异常**: "检测到面部异常，可能存在皮肤问题或其他特征变化。"

#### 虹膜检测 (iris)
- **正常**: "虹膜检测结果正常，虹膜结构完整，无异常特征。"
- **异常**: "检测到虹膜异常，可能存在眼部疾病或其他问题。"

#### 语音检测 (voice)
- **正常**: "语音检测结果正常，声纹特征稳定，无异常变化。"
- **异常**: "检测到语音异常，可能存在嗓音问题或其他变化。"

### 使用建议

每种检测类型都提供相应的使用建议：

- **指纹**: 建议保持良好的手部卫生，定期清洁指纹采集设备
- **面部**: 建议保持良好的面部护理习惯，避免过度暴露在阳光下
- **虹膜**: 建议定期进行眼科检查，保持良好的用眼习惯
- **语音**: 建议保持良好的嗓音习惯，避免过度用嗓

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
  "message": "用户名、档案名称和图片URL为必填项",
  "code": 400
}
```

---

## 前端调用示例

### JavaScript 示例

```javascript
// 获取检测记录列表
async function getDetections(username, page = 1, limit = 10) {
  try {
    const response = await fetch(`/api/miniprogram/detection?username=${username}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('检测记录:', result.data.detections)
      console.log('用户信息:', result.data.subUser)
      console.log('分页信息:', result.data.pagination)
    } else {
      console.error('获取失败:', result.message)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 创建检测记录
async function createDetection(detectionData) {
  try {
    const response = await fetch('/api/miniprogram/detection', {
      method: 'POST',
      headers: {
        'X-Openid': 'your_openid_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(detectionData)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('检测记录:', result.data.detection)
      console.log('第三方结果:', result.data.thirdPartyResult)
    } else {
      console.error('创建失败:', result.message)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}

// 使用示例
getDetections('subuser001')

createDetection({
  username: 'subuser001',
  archiveName: '新检测',
  detectionType: 'fingerprint',
  imageUrl: 'https://example.com/image.jpg'
})
```

### 微信小程序示例

```javascript
// 获取检测记录列表
wx.request({
  url: 'https://your-domain.com/api/miniprogram/detection',
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
      console.log('检测记录:', res.data.data.detections)
      console.log('用户信息:', res.data.data.subUser)
    } else {
      console.error('获取失败:', res.data.message)
    }
  },
  fail: function(error) {
    console.error('请求失败:', error)
  }
})

// 创建检测记录
wx.request({
  url: 'https://your-domain.com/api/miniprogram/detection',
  method: 'POST',
  header: {
    'X-Openid': wx.getStorageSync('openid'),
    'Content-Type': 'application/json'
  },
  data: {
    username: 'subuser001',
    archiveName: '新检测',
    detectionType: 'fingerprint',
    imageUrl: 'https://example.com/image.jpg'
  },
  success: function(res) {
    if (res.data.success) {
      console.log('检测记录:', res.data.data.detection)
      console.log('第三方结果:', res.data.data.thirdPartyResult)
      
      // 显示检测结果
      wx.showModal({
        title: '检测完成',
        content: res.data.data.thirdPartyResult.description,
        showCancel: false
      })
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
- 确保只有该微信用户下的子用户才能进行检测
- 防止跨用户操作

### 2. 第三方服务调用
- 调用 Mock 第三方检测服务
- 模拟真实的网络延迟和结果生成
- 根据检测类型生成相应的描述和建议

### 3. 数据存储
- 将检测结果存储到数据库
- 更新用户的检测数量统计
- 保持数据的一致性和完整性

### 4. 结果返回
- 返回完整的检测记录信息
- 包含第三方检测的详细结果
- 提供用户友好的描述和建议

---

## 注意事项

1. **认证要求**: 所有接口都需要提供有效的 `X-Openid` 头部
2. **用户权限**: 只能操作自己微信用户下的子用户检测
3. **图片URL**: 支持 http、https 和相对路径格式
4. **检测类型**: 支持指纹、面部、虹膜、语音四种类型
5. **Mock 服务**: 当前使用 Mock 服务，后续可替换为真实第三方服务
6. **网络延迟**: Mock 服务会模拟 1-3 秒的网络延迟
7. **结果概率**: 正常结果概率 70%，异常结果概率 30% 