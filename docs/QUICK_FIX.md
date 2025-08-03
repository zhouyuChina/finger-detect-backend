# Profile 接口快速修复方案

## 🚨 问题描述

微信小程序调用 Profile 接口时出现 500 错误，经过调试发现可能是 JWT 验证或数据库连接问题。

## ⚡ 快速解决方案

### 方案 1: 使用简化版接口（推荐）

将微信小程序中的接口地址改为简化版，跳过 JWT 验证：

```javascript
// 原来的接口地址
const PROFILE_URL = 'http://localhost:3001/api/user/profile'
const STATS_URL = 'http://localhost:3001/api/user/stats'

// 改为微信小程序专用接口
const PROFILE_URL = 'http://localhost:3001/api/miniprogram/profile'
const STATS_URL = 'http://localhost:3001/api/miniprogram/stats'
```
```

### 方案 2: 修改微信小程序请求代码

确保请求头格式正确：

```javascript
// 获取用户信息
function getProfile() {
  const token = wx.getStorageSync('userToken') || 'test-token'
  
  wx.request({
    url: 'http://localhost:3001/api/miniprogram/profile', // 使用微信小程序专用接口
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token, // 注意空格
      'Content-Type': 'application/json'
    },
    success: (res) => {
      console.log('Profile 响应:', res.data)
      if (res.data.code === 200) {
        // 处理成功响应
        this.setData({
          userInfo: res.data.data
        })
      } else {
        console.error('Profile 错误:', res.data.message)
      }
    },
    fail: (err) => {
      console.error('Profile 请求失败:', err)
    }
  })
}

// 获取统计信息
function getStats() {
  const token = wx.getStorageSync('userToken') || 'test-token'
  
  wx.request({
    url: 'http://localhost:3001/api/miniprogram/stats', // 使用微信小程序专用接口
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token, // 注意空格
      'Content-Type': 'application/json'
    },
    success: (res) => {
      console.log('Stats 响应:', res.data)
      if (res.data.code === 200) {
        // 处理成功响应
        this.setData({
          stats: res.data.data
        })
      } else {
        console.error('Stats 错误:', res.data.message)
      }
    },
    fail: (err) => {
      console.error('Stats 请求失败:', err)
    }
  })
}
```

### 方案 3: 添加调试代码

在微信小程序中添加调试代码，帮助定位问题：

```javascript
// 调试函数
function debugRequest() {
  const token = wx.getStorageSync('userToken') || 'test-token'
  
  console.log('当前 Token:', token)
  
  wx.request({
    url: 'http://localhost:3001/api/user/debug',
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    success: (res) => {
      console.log('调试响应:', res.data)
    },
    fail: (err) => {
      console.error('调试请求失败:', err)
    }
  })
}

// 在页面加载时调用
onLoad() {
  debugRequest() // 先调试
  setTimeout(() => {
    getProfile() // 再获取数据
    getStats()
  }, 1000)
}
```

## 🔧 完整修复步骤

### 步骤 1: 检查服务器状态

```bash
# 确保服务器正在运行
ps aux | grep "next dev"

# 如果没有运行，启动服务器
npm run dev
```

### 步骤 2: 测试接口

```bash
# 测试调试接口
curl -X GET "http://localhost:3001/api/user/debug" \
  -H "Authorization: Bearer test-token"

# 测试简化版接口
curl -X GET "http://localhost:3001/api/user/profile-simple" \
  -H "Authorization: Bearer test-token"

curl -X GET "http://localhost:3001/api/user/stats-simple" \
  -H "Authorization: Bearer test-token"
```

### 步骤 3: 修改微信小程序代码

1. 将接口地址改为简化版
2. 确保 Authorization 头格式正确
3. 添加错误处理和调试信息

### 步骤 4: 测试微信小程序

1. 重新编译微信小程序
2. 查看控制台日志
3. 确认接口调用成功

## 📋 检查清单

- [ ] 服务器正在运行 (端口 3001)
- [ ] 简化版接口可以正常访问
- [ ] 微信小程序请求头格式正确
- [ ] Token 格式正确 (Bearer + 空格 + token)
- [ ] 网络连接正常
- [ ] 控制台没有错误信息

## 🎯 预期结果

使用简化版接口后，应该看到：

```json
// Profile 接口响应
{
  "code": 200,
  "message": "获取用户信息成功（模拟数据）",
  "data": {
    "id": "mock-user-id",
    "name": "测试用户",
    "nickname": "测试用户",
    "username": "testuser",
    "phone": "138****8888",
    "avatar": "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=测",
    "avatarUrl": "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=测",
    "email": "test@example.com",
    "gender": "male",
    "birthday": null,
    "createdAt": "2025-08-02T04:01:43.623Z",
    "updatedAt": "2025-08-02T04:01:43.623Z"
  }
}

// Stats 接口响应
{
  "code": 200,
  "message": "获取用户统计信息成功（模拟数据）",
  "data": {
    "totalRecords": 15,
    "photoRecords": 15,
    "totalReports": 8,
    "reportRecords": 8,
    "familyMembers": 3,
    "profileRecords": 3,
    "totalDetections": 25,
    "detectionCount": 25,
    "unreadMessages": 2,
    "unreadCount": 2
  }
}
```

## 🔄 后续优化

1. **恢复完整版接口：** 解决 JWT 验证问题后，可以切换回完整版接口
2. **添加错误重试：** 实现自动重试机制
3. **优化用户体验：** 添加加载状态和错误提示
4. **完善错误处理：** 处理各种网络错误情况

## 📞 如果问题仍然存在

如果按照以上步骤仍然无法解决问题，请：

1. 检查服务器终端日志
2. 查看微信小程序控制台错误信息
3. 确认网络连接和防火墙设置
4. 提供详细的错误信息以便进一步诊断

---

**注意：** 简化版接口会跳过 JWT 验证，仅用于调试和临时解决方案。在生产环境中，应该使用完整版接口并确保 JWT 验证正常工作。 