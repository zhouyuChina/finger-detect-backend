# 前端迁移指南 - 检测接口参数变更

## 概述

由于后端接口参数从 `username` 和 `archiveName` 改为 `subUserId` 和 `archiveId`，前端需要进行相应的调整。本文档详细说明了需要修改的地方和迁移策略。

## 变更说明

### 参数变更对比

| 旧参数 | 新参数 | 说明 |
|--------|--------|------|
| `username` | `subUserId` | 从用户名字符串改为子用户ID (cuid) |
| `archiveName` | `archiveId` | 从档案名称字符串改为档案ID (cuid) |

### 影响的接口

1. `GET /api/miniprogram/detection` - 获取子用户检测记录
2. `GET /api/miniprogram/archive-detections` - 获取档案检测记录
3. `POST /api/miniprogram/detection` - 创建检测记录
4. `POST /api/miniprogram/detection-fixed` - 创建检测记录（修复版）

## 需要新增的接口调用

### 1. 获取子用户列表

**接口地址：** `GET /api/miniprogram/user`

**功能：** 获取当前微信用户下的所有子用户

**请求示例：**
```javascript
const getSubUsers = async () => {
  const response = await fetch('/api/miniprogram/user', {
    headers: {
      'x-openid': openid, // 从登录状态获取
      'Content-Type': 'application/json'
    }
  })
  const result = await response.json()
  return result.data.subUsers
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "subUsers": [
      {
        "id": "cmdxi4qnv0025s6i8aqa7zii5",
        "username": "微信用户",
        "realName": "张三",
        "status": "active"
      }
    ]
  }
}
```

### 2. 获取档案列表

**接口地址：** `GET /api/miniprogram/archives`

**功能：** 获取指定子用户的所有档案

**请求示例：**
```javascript
const getArchives = async (subUserId) => {
  const response = await fetch(`/api/miniprogram/archives?subUserId=${subUserId}`, {
    headers: {
      'x-openid': openid,
      'Content-Type': 'application/json'
    }
  })
  const result = await response.json()
  return result.data.archives
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "archives": [
      {
        "id": "cmdxi4qnv0025s6i8aqa7zii7",
        "archiveName": "测试档案",
        "activity": "medium",
        "photoCount": 5,
        "bodyPart": "left_hand_thumb",
        "detectionTime": "2024-01-20T15:45:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

## 需要修改的现有代码

### 1. API 调用函数

#### 旧版本
```javascript
// detectionAPI.js
export const detectionAPI = {
  // 获取检测记录
  getDetections: (username, page = 1, limit = 10) => 
    fetch(`/api/miniprogram/detection?username=${username}&page=${page}&limit=${limit}`, {
      headers: { 'x-openid': openid }
    }),
  
  // 获取档案检测记录
  getArchiveDetections: (username, archiveName, page = 1, limit = 20) =>
    fetch(`/api/miniprogram/archive-detections?username=${username}&archiveName=${archiveName}&page=${page}&limit=${limit}`, {
      headers: { 'x-openid': openid }
    }),
  
  // 创建检测记录
  createDetection: (username, archiveName, detectionType, imageUrl) =>
    fetch('/api/miniprogram/detection', {
      method: 'POST',
      headers: { 
        'x-openid': openid,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, archiveName, detectionType, imageUrl })
    })
}
```

#### 新版本
```javascript
// detectionAPI.js
export const detectionAPI = {
  // 获取检测记录
  getDetections: (subUserId, page = 1, limit = 10) => 
    fetch(`/api/miniprogram/detection?subUserId=${subUserId}&page=${page}&limit=${limit}`, {
      headers: { 'x-openid': openid }
    }),
  
  // 获取档案检测记录
  getArchiveDetections: (subUserId, archiveId, page = 1, limit = 20) =>
    fetch(`/api/miniprogram/archive-detections?subUserId=${subUserId}&archiveId=${archiveId}&page=${page}&limit=${limit}`, {
      headers: { 'x-openid': openid }
    }),
  
  // 创建检测记录
  createDetection: (subUserId, archiveId, detectionType, imageUrl) =>
    fetch('/api/miniprogram/detection', {
      method: 'POST',
      headers: { 
        'x-openid': openid,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subUserId, archiveId, detectionType, imageUrl })
    })
}
```

### 2. React 组件修改

#### 旧版本
```javascript
// DetectionPage.jsx
import React, { useState, useEffect } from 'react'
import { detectionAPI } from './detectionAPI'

function DetectionPage() {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetections = async () => {
      setLoading(true)
      try {
        const response = await detectionAPI.getDetections('微信用户')
        const result = await response.json()
        if (result.success) {
          setDetections(result.data.detections)
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }

    fetchDetections()
  }, [])

  return (
    <div>
      <h2>检测记录</h2>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error}</div>}
      {detections.map(detection => (
        <div key={detection.id}>
          <p>档案: {detection.archiveName}</p>
          <p>结果: {detection.result}</p>
        </div>
      ))}
    </div>
  )
}
```

#### 新版本
```javascript
// DetectionPage.jsx
import React, { useState, useEffect } from 'react'
import { detectionAPI } from './detectionAPI'

function DetectionPage() {
  const [detections, setDetections] = useState([])
  const [subUserId, setSubUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取子用户ID
  useEffect(() => {
    const fetchSubUsers = async () => {
      try {
        const response = await fetch('/api/miniprogram/user', {
          headers: { 'x-openid': openid }
        })
        const result = await response.json()
        if (result.success && result.data.subUsers.length > 0) {
          setSubUserId(result.data.subUsers[0].id)
        }
      } catch (err) {
        setError('获取用户信息失败')
      }
    }

    fetchSubUsers()
  }, [])

  // 获取检测记录
  useEffect(() => {
    if (!subUserId) return

    const fetchDetections = async () => {
      setLoading(true)
      try {
        const response = await detectionAPI.getDetections(subUserId)
        const result = await response.json()
        if (result.success) {
          setDetections(result.data.detections)
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }

    fetchDetections()
  }, [subUserId])

  return (
    <div>
      <h2>检测记录</h2>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error}</div>}
      {detections.map(detection => (
        <div key={detection.id}>
          <p>档案: {detection.archiveName}</p>
          <p>结果: {detection.result}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Vue 组件修改

#### 旧版本
```javascript
// DetectionPage.vue
<template>
  <div>
    <h2>检测记录</h2>
    <div v-if="loading">加载中...</div>
    <div v-if="error">错误: {{ error }}</div>
    <div v-for="detection in detections" :key="detection.id">
      <p>档案: {{ detection.archiveName }}</p>
      <p>结果: {{ detection.result }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { detectionAPI } from './detectionAPI'

export default {
  setup() {
    const detections = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchDetections = async () => {
      loading.value = true
      try {
        const response = await detectionAPI.getDetections('微信用户')
        const result = await response.json()
        if (result.success) {
          detections.value = result.data.detections
        } else {
          error.value = result.message
        }
      } catch (err) {
        error.value = '网络错误'
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchDetections)

    return {
      detections,
      loading,
      error
    }
  }
}
</script>
```

#### 新版本
```javascript
// DetectionPage.vue
<template>
  <div>
    <h2>检测记录</h2>
    <div v-if="loading">加载中...</div>
    <div v-if="error">错误: {{ error }}</div>
    <div v-for="detection in detections" :key="detection.id">
      <p>档案: {{ detection.archiveName }}</p>
      <p>结果: {{ detection.result }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { detectionAPI } from './detectionAPI'

export default {
  setup() {
    const detections = ref([])
    const subUserId = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const fetchSubUsers = async () => {
      try {
        const response = await fetch('/api/miniprogram/user', {
          headers: { 'x-openid': openid }
        })
        const result = await response.json()
        if (result.success && result.data.subUsers.length > 0) {
          subUserId.value = result.data.subUsers[0].id
        }
      } catch (err) {
        error.value = '获取用户信息失败'
      }
    }

    const fetchDetections = async () => {
      if (!subUserId.value) return
      
      loading.value = true
      try {
        const response = await detectionAPI.getDetections(subUserId.value)
        const result = await response.json()
        if (result.success) {
          detections.value = result.data.detections
        } else {
          error.value = result.message
        }
      } catch (err) {
        error.value = '网络错误'
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchSubUsers)
    watch(subUserId, fetchDetections)

    return {
      detections,
      loading,
      error
    }
  }
}
</script>
```

### 4. 档案详情页面修改

#### 旧版本
```javascript
// ArchiveDetailPage.jsx
function ArchiveDetailPage({ username, archiveName }) {
  const [archiveData, setArchiveData] = useState(null)

  useEffect(() => {
    const fetchArchiveData = async () => {
      const response = await detectionAPI.getArchiveDetections(username, archiveName)
      const result = await response.json()
      if (result.success) {
        setArchiveData(result.data)
      }
    }

    fetchArchiveData()
  }, [username, archiveName])

  // 渲染逻辑...
}
```

#### 新版本
```javascript
// ArchiveDetailPage.jsx
function ArchiveDetailPage({ subUserId, archiveId }) {
  const [archiveData, setArchiveData] = useState(null)

  useEffect(() => {
    const fetchArchiveData = async () => {
      const response = await detectionAPI.getArchiveDetections(subUserId, archiveId)
      const result = await response.json()
      if (result.success) {
        setArchiveData(result.data)
      }
    }

    fetchArchiveData()
  }, [subUserId, archiveId])

  // 渲染逻辑...
}
```

## 迁移策略

### 1. 渐进式迁移

可以保留旧接口一段时间，添加兼容层：

```javascript
// 兼容层
const getDetections = async (usernameOrSubUserId, page = 1) => {
  // 判断是 username 还是 subUserId
  if (usernameOrSubUserId.startsWith('cmdxi')) {
    // 新版本：直接使用 subUserId
    return detectionAPI.getDetections(usernameOrSubUserId, page)
  } else {
    // 旧版本：先获取 subUserId，再调用新接口
    const subUsers = await getSubUsers()
    const subUser = subUsers.find(u => u.username === usernameOrSubUserId)
    if (subUser) {
      return detectionAPI.getDetections(subUser.id, page)
    }
    throw new Error('用户不存在')
  }
}
```

### 2. 数据获取流程调整

#### 旧流程
```
用户登录 → 直接使用 username → 调用检测接口
```

#### 新流程
```
用户登录 → 获取 subUsers → 选择 subUserId → 获取 archives → 选择 archiveId → 调用检测接口
```

### 3. 状态管理调整

#### Redux/Zustand 状态更新
```javascript
// 旧状态
const state = {
  currentUser: '微信用户',
  currentArchive: '测试档案'
}

// 新状态
const state = {
  currentSubUserId: 'cmdxi4qnv0025s6i8aqa7zii5',
  currentArchiveId: 'cmdxi4qnv0025s6i8aqa7zii7',
  subUsers: [],
  archives: []
}
```

## 需要更新的文件清单

### 1. API 相关文件
- `src/api/detectionAPI.js` - 检测相关API调用
- `src/api/userAPI.js` - 用户相关API调用（新增）
- `src/api/archiveAPI.js` - 档案相关API调用（新增）

### 2. 组件文件
- `src/components/DetectionList.jsx` - 检测记录列表
- `src/components/ArchiveDetail.jsx` - 档案详情
- `src/components/CreateDetection.jsx` - 创建检测
- `src/pages/DetectionPage.jsx` - 检测页面
- `src/pages/ArchivePage.jsx` - 档案页面

### 3. 状态管理文件
- `src/store/detectionSlice.js` - 检测状态管理
- `src/store/userSlice.js` - 用户状态管理（更新）
- `src/store/archiveSlice.js` - 档案状态管理（新增）

### 4. 工具函数文件
- `src/utils/api.js` - API工具函数
- `src/utils/constants.js` - 常量定义

### 5. 测试文件
- `src/__tests__/detectionAPI.test.js` - API测试
- `src/__tests__/DetectionPage.test.jsx` - 组件测试

## 测试要点

### 1. 功能测试
- [ ] 获取子用户列表功能正常
- [ ] 获取档案列表功能正常
- [ ] 检测记录获取功能正常
- [ ] 检测记录创建功能正常
- [ ] 档案详情获取功能正常

### 2. 错误处理测试
- [ ] 用户不存在时的错误处理
- [ ] 档案不存在时的错误处理
- [ ] 网络错误时的错误处理
- [ ] 参数错误时的错误处理

### 3. 用户体验测试
- [ ] 页面加载状态显示
- [ ] 错误信息提示
- [ ] 数据为空时的提示
- [ ] 页面跳转逻辑

## 注意事项

### 1. 向后兼容
- 建议保留旧接口一段时间
- 提供迁移指南给其他开发者
- 在文档中明确标注接口变更

### 2. 性能考虑
- 新增的API调用可能增加页面加载时间
- 考虑添加缓存机制
- 优化API调用时机

### 3. 安全性
- 确保用户只能访问自己的数据
- 验证 subUserId 和 archiveId 的权限
- 防止越权访问

### 4. 用户体验
- 保持界面交互逻辑不变
- 确保数据展示格式一致
- 提供清晰的错误提示

## 完成检查清单

- [ ] 更新所有API调用函数
- [ ] 修改相关组件代码
- [ ] 更新状态管理逻辑
- [ ] 添加新的API接口调用
- [ ] 更新测试用例
- [ ] 更新文档
- [ ] 进行功能测试
- [ ] 进行错误处理测试
- [ ] 进行用户体验测试
- [ ] 部署到测试环境验证 