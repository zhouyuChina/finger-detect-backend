# 检测结果和图片获取接口文档

本文档详细说明了获取检测结果和图片的所有接口，包括微信小程序端和管理员端的API。

## 数据模型关系

```
openid (微信用户) → subUser (子用户) → archives (档案) → detections (检测记录)
```

所有关联都使用 cuid 作为唯一标识符，确保数据的一致性和安全性。

## 微信小程序端接口

### 1. 获取子用户的所有检测记录

**接口地址：** `GET /api/miniprogram/detection`

**功能说明：** 获取指定子用户的所有检测记录（按时间倒序排列）

**请求参数：**
- `subUserId` (string, 必填): 子用户ID (cuid)
- `page` (number, 可选): 页码，默认为 1
- `limit` (number, 可选): 每页数量，默认为 10

**请求示例：**
```bash
curl -X GET "http://localhost:3001/api/miniprogram/detection?subUserId=cmdxi4qnv0025s6i8aqa7zii5&page=1&limit=10" \
  -H "x-openid: oJxdMvo4dM2s4FHkuZqoucCJavnU" \
  -H "Content-Type: application/json"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取检测记录成功",
  "data": {
    "subUser": {
      "id": "cmdxi4qnv0025s6i8aqa7zii5",
      "username": "微信用户",
      "realName": "张三"
    },
    "detections": [
      {
        "id": "cmdxi4qnv0025s6i8aqa7zii6",
        "archiveName": "测试档案",
        "detectionType": "left_hand_thumb",
        "imageUrl": "/uploads/test-image.jpg",
        "result": "normal",
        "confidence": 0.92,
        "status": "completed",
        "errorMsg": null,
        "remark": "检测类型: left_hand_thumb, 置信度: 0.92",
        "detectionTime": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 2. 获取指定档案的所有检测记录

**接口地址：** `GET /api/miniprogram/archive-detections`

**功能说明：** 获取指定档案的所有检测记录、图片和统计信息

**请求参数：**
- `subUserId` (string, 必填): 子用户ID (cuid)
- `archiveId` (string, 必填): 档案ID (cuid)
- `page` (number, 可选): 页码，默认为 1
- `limit` (number, 可选): 每页数量，默认为 20

**请求示例：**
```bash
curl -X GET "http://localhost:3001/api/miniprogram/archive-detections?subUserId=cmdxi4qnv0025s6i8aqa7zii5&archiveId=cmdxi4qnv0025s6i8aqa7zii7&page=1&limit=20" \
  -H "x-openid: oJxdMvo4dM2s4FHkuZqoucCJavnU" \
  -H "Content-Type: application/json"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取档案检测记录成功",
  "data": {
    "report": {
      "archive": {
        "id": "cmdxi4qnv0025s6i8aqa7zii7",
        "archiveName": "测试档案",
        "status": "medium",
        "totalDetections": 5,
        "bodyPart": "left_hand_thumb",
        "startDate": "2024-01-15T10:30:00.000Z",
        "lastDetectionTime": "2024-01-20T15:45:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T15:45:00.000Z"
      },
      "statistics": {
        "totalDetections": 5,
        "normalCount": 3,
        "abnormalCount": 2,
        "averageConfidence": 0.85,
        "latestDetection": {
          "id": "cmdxi4qnv0025s6i8aqa7zii8",
          "result": "normal",
          "confidence": 0.92,
          "createdAt": "2024-01-20T15:45:00.000Z"
        }
      },
      "detections": [
        {
          "id": "cmdxi4qnv0025s6i8aqa7zii8",
          "archiveName": "测试档案",
          "detectionType": "left_hand_thumb",
          "imageUrl": "/uploads/test-image-5.jpg",
          "result": "normal",
          "confidence": 0.92,
          "status": "completed",
          "errorMsg": null,
          "remark": "检测类型: left_hand_thumb, 置信度: 0.92",
          "detectionTime": "2024-01-20T15:45:00.000Z",
          "createdAt": "2024-01-20T15:45:00.000Z",
          "updatedAt": "2024-01-20T15:45:00.000Z"
        }
      ]
    },
    "images": [
      {
        "id": "cmdxi4qnv0025s6i8aqa7zii8",
        "imageUrl": "/uploads/test-image-5.jpg",
        "result": "normal",
        "confidence": 0.92,
        "detectionTime": "2024-01-20T15:45:00.000Z",
        "createdAt": "2024-01-20T15:45:00.000Z",
        "remark": "检测类型: left_hand_thumb, 置信度: 0.92"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "subUser": {
      "id": "cmdxi4qnv0025s6i8aqa7zii5",
      "username": "微信用户",
      "realName": "张三"
    }
  }
}
```

## 管理员端接口

### 3. 获取所有检测记录（管理员）

**接口地址：** `GET /api/detections`

**功能说明：** 管理员获取所有检测记录，支持多种筛选条件

**请求参数：**
- `subUserId` (string, 可选): 子用户ID筛选
- `archiveId` (string, 可选): 档案ID筛选
- `bodyPart` (string, 可选): 检测部位筛选
- `result` (string, 可选): 检测结果筛选 (normal/abnormal)
- `status` (string, 可选): 状态筛选 (pending/completed/failed)
- `page` (number, 可选): 页码，默认为 1
- `limit` (number, 可选): 每页数量，默认为 20

**请求示例：**
```bash
curl -X GET "http://localhost:3001/api/detections?subUserId=cmdxi4qnv0025s6i8aqa7zii5&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取检测记录成功",
  "data": {
    "data": [
      {
        "id": "cmdxi4qnv0025s6i8aqa7zii6",
        "subUserId": "cmdxi4qnv0025s6i8aqa7zii5",
        "archiveName": "测试档案",
        "detectionType": "left_hand_thumb",
        "imageUrl": "/uploads/test-image.jpg",
        "result": "normal",
        "confidence": 0.92,
        "status": "completed",
        "errorMsg": null,
        "remark": "检测类型: left_hand_thumb, 置信度: 0.92",
        "detectionTime": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "subUser": {
          "id": "cmdxi4qnv0025s6i8aqa7zii5",
          "username": "微信用户",
          "realName": "张三",
          "wechatUser": {
            "id": "cmdxi4qnv0025s6i8aqa7zii4",
            "openid": "oJxdMvo4dM2s4FHkuZqoucCJavnU",
            "nickname": "微信用户"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 4. 获取单个检测记录详情（管理员）

**接口地址：** `GET /api/detections/{id}`

**功能说明：** 获取指定检测记录的详细信息

**路径参数：**
- `id` (string, 必填): 检测记录ID (cuid)

**请求示例：**
```bash
curl -X GET "http://localhost:3001/api/detections/cmdxi4qnv0025s6i8aqa7zii6" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取检测记录成功",
  "data": {
    "id": "cmdxi4qnv0025s6i8aqa7zii6",
    "subUserId": "cmdxi4qnv0025s6i8aqa7zii5",
    "archiveName": "测试档案",
    "detectionType": "left_hand_thumb",
    "imageUrl": "/uploads/test-image.jpg",
    "result": "normal",
    "confidence": 0.92,
    "status": "completed",
    "errorMsg": null,
    "remark": "检测类型: left_hand_thumb, 置信度: 0.92",
    "detectionTime": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "subUser": {
      "id": "cmdxi4qnv0025s6i8aqa7zii5",
      "username": "微信用户",
      "realName": "张三",
      "wechatUser": {
        "id": "cmdxi4qnv0025s6i8aqa7zii4",
        "openid": "oJxdMvo4dM2s4FHkuZqoucCJavnU",
        "nickname": "微信用户"
      }
    }
  }
}
```

## 字段说明

### 检测记录字段
- `id`: 检测记录唯一标识符 (cuid)
- `subUserId`: 子用户ID (cuid)
- `archiveName`: 档案名称
- `detectionType`: 检测类型（具体部位）
- `imageUrl`: 检测图片URL
- `result`: 检测结果 (normal/abnormal)
- `confidence`: 置信度 (0-1)
- `status`: 检测状态 (pending/completed/failed)
- `errorMsg`: 错误信息（如果有）
- `remark`: 备注信息
- `detectionTime`: 检测时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 档案字段
- `id`: 档案唯一标识符 (cuid)
- `archiveName`: 档案名称
- `status`: 档案状态 (low/medium/high)
- `totalDetections`: 总检测次数
- `bodyPart`: 检测部位
- `startDate`: 档案创建时间
- `lastDetectionTime`: 最后检测时间

### 用户字段
- `id`: 用户唯一标识符 (cuid)
- `username`: 用户名
- `realName`: 真实姓名
- `openid`: 微信openid

## 支持的检测类型

系统支持以下检测类型：

### 手部检测
- `left_hand_thumb`: 左手拇指
- `left_hand_index`: 左手食指
- `left_hand_middle`: 左手中指
- `left_hand_ring`: 左手无名指
- `left_hand_little`: 左手小指
- `right_hand_thumb`: 右手拇指
- `right_hand_index`: 右手食指
- `right_hand_middle`: 右手中指
- `right_hand_ring`: 右手无名指
- `right_hand_little`: 右手小指

### 脚部检测
- `left_foot_big`: 左脚大脚趾
- `left_foot_second`: 左脚第二趾
- `left_foot_third`: 左脚第三趾
- `left_foot_fourth`: 左脚第四趾
- `left_foot_little`: 左脚小脚趾
- `right_foot_big`: 右脚大脚趾
- `right_foot_second`: 右脚第二趾
- `right_foot_third`: 右脚第三趾
- `right_foot_fourth`: 右脚第四趾
- `right_foot_little`: 右脚小脚趾

## 前端代码示例

### React Hook 示例

```javascript
import { useState, useEffect } from 'react'

// 获取档案检测记录
const useArchiveDetections = (subUserId, archiveId, page = 1, limit = 20) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!subUserId || !archiveId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `/api/miniprogram/archive-detections?subUserId=${subUserId}&archiveId=${archiveId}&page=${page}&limit=${limit}`,
          {
            headers: {
              'x-openid': 'YOUR_OPENID', // 从登录状态获取
              'Content-Type': 'application/json'
            }
          }
        )
        
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subUserId, archiveId, page, limit])

  return { data, loading, error }
}

// 使用示例
function ArchiveDetectionsPage() {
  const { data, loading, error } = useArchiveDetections(
    'cmdxi4qnv0025s6i8aqa7zii5',
    'cmdxi4qnv0025s6i8aqa7zii7'
  )

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>
  if (!data) return <div>暂无数据</div>

  return (
    <div>
      <h2>档案检测记录</h2>
      <div>档案名称: {data.report.archive.archiveName}</div>
      <div>总检测数: {data.report.statistics.totalDetections}</div>
      <div>正常检测: {data.report.statistics.normalCount}</div>
      <div>异常检测: {data.report.statistics.abnormalCount}</div>
      
      <h3>检测图片</h3>
      <div className="image-grid">
        {data.images.map(image => (
          <div key={image.id} className="image-item">
            <img src={image.imageUrl} alt="检测图片" />
            <div>结果: {image.result}</div>
            <div>置信度: {image.confidence}</div>
            <div>时间: {new Date(image.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Vue 3 Composition API 示例

```javascript
import { ref, watch } from 'vue'

// 获取档案检测记录
export function useArchiveDetections(subUserId, archiveId, page = 1, limit = 20) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async () => {
    if (!subUserId.value || !archiveId.value) return

    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(
        `/api/miniprogram/archive-detections?subUserId=${subUserId.value}&archiveId=${archiveId.value}&page=${page.value}&limit=${limit.value}`,
        {
          headers: {
            'x-openid': 'YOUR_OPENID', // 从登录状态获取
            'Content-Type': 'application/json'
          }
        }
      )
      
      const result = await response.json()
      
      if (result.success) {
        data.value = result.data
      } else {
        error.value = result.message
      }
    } catch (err) {
      error.value = '网络错误'
    } finally {
      loading.value = false
    }
  }

  watch([subUserId, archiveId, page, limit], fetchData, { immediate: true })

  return { data, loading, error, fetchData }
}
```

## 错误处理

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息",
  "error": "详细错误信息（可选）"
}
```

## 业务逻辑说明

### 检测记录创建规则

1. **首次检测**: 为档案创建第一份检测报告，更新 `subUser.reports` 计数
2. **后续检测**: 只记录图片，不生成新报告，更新 `subUser.photos` 计数
3. **档案关联**: 每个检测记录都关联到特定的档案和子用户

### 权限控制

1. **微信小程序端**: 只能访问当前微信用户关联的子用户数据
2. **管理员端**: 可以访问所有数据，支持多种筛选条件
3. **数据隔离**: 通过 `subUserId` 确保数据安全隔离

### 分页说明

- 所有列表接口都支持分页
- 默认页码为 1，默认每页数量为 10-20
- 分页信息包含总数、总页数、是否有下一页等

## 重要注意事项

1. **认证要求**: 所有接口都需要相应的认证（微信小程序需要 `x-openid` 头，管理员需要 JWT token）
2. **参数验证**: 所有必填参数都会进行验证，缺少参数会返回 400 错误
3. **数据一致性**: 使用 cuid 作为唯一标识符，确保数据一致性
4. **性能考虑**: 大量数据查询建议使用分页，避免一次性加载过多数据
5. **图片访问**: 检测图片通过相对路径访问，需要确保图片文件存在且可访问 