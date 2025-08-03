# 基于 OpenID 的会话管理指南

## 概述

本项目实现了基于 `openid` 的简单会话管理方案，无需复杂的 JWT token 机制，直接在 localStorage 中存储 `openid` 和用户信息。

## 核心特性

- ✅ **简单易用**：直接使用 `openid` 进行认证
- ✅ **自动读取**：自动从 localStorage 读取 `openid`
- ✅ **持久化存储**：使用 localStorage 持久化会话信息
- ✅ **自动刷新**：支持自动刷新用户信息
- ✅ **错误处理**：自动处理认证失败和过期情况

## 文件结构

```
src/
├── hooks/
│   ├── useOpenidSession.js      # 核心会话管理 Hook
│   └── useLocalStorage.js       # localStorage 工具
├── lib/
│   └── miniprogramAuth.js       # 认证中间件（支持 openid）
└── components/
    └── OpenidSessionExample.js  # 使用示例
```

## 使用方法

### 1. 在组件中使用会话管理

```javascript
import { useOpenidSession, miniprogramApi } from '../hooks/useOpenidSession.js'

function MyComponent() {
  const { 
    openid, 
    userInfo, 
    isLoggedIn, 
    logout,
    refreshUserInfo 
  } = useOpenidSession()

  // 登出
  const handleLogout = () => {
    logout()
  }

  // 刷新用户信息
  const handleRefresh = async () => {
    await refreshUserInfo()
  }

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <p>欢迎，{userInfo?.nickName}</p>
          <button onClick={handleLogout}>登出</button>
        </div>
      ) : (
        <div>请在 localStorage 中设置 openid</div>
      )}
    </div>
  )
}
```

### 2. 使用 API 客户端

```javascript
import { miniprogramApi } from '../hooks/useOpenidSession.js'

// 获取用户信息
const userProfile = await miniprogramApi.user.getProfile()

// 获取用户统计
const userStats = await miniprogramApi.user.getStats()

// 创建检测
const detection = await miniprogramApi.detection.create({
  image: 'base64_image_data',
  type: 'fingerprint'
})

// 获取检测列表
const detections = await miniprogramApi.detection.getList()

// 获取新闻列表
const news = await miniprogramApi.news.getList()
```

### 3. 手动发送请求

```javascript
import { openidApiClient } from '../hooks/useOpenidSession.js'

// 自动添加 openid 认证头
const response = await openidApiClient.get('/api/miniprogram/profile')
const response = await openidApiClient.post('/api/miniprogram/detection', data)
```

## 认证机制

### 前端存储

- `openid`: 存储用户的 openid（你需要在登录时设置）
- `user_info`: 存储用户基本信息（自动管理）

### 后端认证

支持两种认证方式：

1. **OpenID 认证（推荐）**：
   ```
   X-Openid: your_openid_here
   ```

2. **JWT Token 认证（兼容）**：
   ```
   Authorization: Bearer your_jwt_token
   ```

## API 接口

### 用户相关

- `GET /api/miniprogram/profile` - 获取用户信息
- `GET /api/miniprogram/stats` - 获取用户统计
- `PUT /api/miniprogram/user` - 更新用户信息

### 检测相关

- `GET /api/miniprogram/detection` - 获取检测列表
- `POST /api/miniprogram/detection` - 创建检测
- `GET /api/miniprogram/detection/:id` - 获取检测详情

### 新闻相关

- `GET /api/miniprogram/news` - 获取新闻列表
- `POST /api/miniprogram/news/read` - 标记已读
- `GET /api/miniprogram/news/read` - 获取阅读状态

## 开发环境

在开发环境下，认证中间件会自动跳过验证，使用模拟用户信息：

```javascript
// 开发环境下的模拟用户
request.user = {
  id: 'cmdmycihz0000eflyo26twnfc',
  openid: 'dev_openid_123',
  nickname: '开发测试用户'
}
```

## 错误处理

### 认证失败

当 API 返回 401 错误时，系统会：

1. 自动清除 localStorage 中的认证信息
2. 触发 `auth:expired` 事件
3. 抛出错误信息

```javascript
// 监听认证过期事件
window.addEventListener('auth:expired', () => {
  // 重定向到登录页或显示登录提示
  console.log('认证已过期，请重新登录')
})
```

### 网络错误

API 客户端会自动处理网络错误，并在控制台输出详细错误信息。

## 最佳实践

1. **初始化检查**：在应用启动时检查登录状态
2. **自动刷新**：定期刷新用户信息保持数据最新
3. **错误处理**：妥善处理认证失败和网络错误
4. **用户体验**：在认证过期时提供友好的提示

## 示例组件

查看 `src/components/OpenidSessionExample.js` 了解完整的使用示例。

## 设置 openid

在登录成功后，你需要在 localStorage 中设置 openid：

```javascript
// 登录成功后设置 openid
localStorage.setItem('openid', 'your_openid_here')

// 或者清除 openid（登出时）
localStorage.removeItem('openid')
```

## 测试

```bash
# 测试 openid 认证
curl -X GET http://localhost:3001/api/miniprogram/profile \
  -H "X-Openid: dev_openid_123"

# 测试统计接口
curl -X GET http://localhost:3001/api/miniprogram/stats \
  -H "X-Openid: dev_openid_123"
``` 