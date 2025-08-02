# Profile 接口调试指南

## 🔍 问题分析

微信小程序调用 Profile 接口时出现 500 错误，可能的原因：

1. **Authorization 头缺失或格式错误**
2. **Token 无效或过期**
3. **服务器端未捕获的错误**
4. **网络连接问题**

## 🛠️ 调试步骤

### 1. 使用调试接口

首先测试调试接口，检查请求头是否正确传递：

```javascript
// 在微信小程序中调用
wx.request({
  url: 'http://localhost:3001/api/user/debug',
  method: 'GET',
  header: {
    'Authorization': 'Bearer your-token-here',
    'Content-Type': 'application/json'
  },
  success: (res) => {
    console.log('调试接口响应:', res.data)
  },
  fail: (err) => {
    console.error('调试接口错误:', err)
  }
})
```

### 2. 使用简化版接口

如果调试接口正常，尝试使用简化版接口：

```javascript
// 简化版用户信息接口
wx.request({
  url: 'http://localhost:3001/api/user/profile-simple',
  method: 'GET',
  header: {
    'Authorization': 'Bearer your-token-here',
    'Content-Type': 'application/json'
  },
  success: (res) => {
    console.log('简化版接口响应:', res.data)
  },
  fail: (err) => {
    console.error('简化版接口错误:', err)
  }
})

// 简化版统计接口
wx.request({
  url: 'http://localhost:3001/api/user/stats-simple',
  method: 'GET',
  header: {
    'Authorization': 'Bearer your-token-here',
    'Content-Type': 'application/json'
  },
  success: (res) => {
    console.log('简化版统计接口响应:', res.data)
  },
  fail: (err) => {
    console.error('简化版统计接口错误:', err)
  }
})
```

### 3. 检查服务器日志

在服务器终端中查看详细的调试日志：

```bash
# 查看服务器运行状态
ps aux | grep "next dev"

# 查看服务器日志（在运行 npm run dev 的终端中）
```

## 🔧 常见问题解决方案

### 问题 1: Authorization 头缺失

**症状：** 服务器日志显示 "缺少 Authorization 头"

**解决方案：**
```javascript
// 确保在请求头中包含 Authorization
wx.request({
  url: 'http://localhost:3001/api/user/profile',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + token, // 注意空格
    'Content-Type': 'application/json'
  },
  // ...
})
```

### 问题 2: Token 格式错误

**症状：** 服务器日志显示 "Authorization 头格式错误"

**解决方案：**
```javascript
// 确保 token 格式正确
const token = 'your-actual-token' // 不要包含 'Bearer '
const authHeader = 'Bearer ' + token // 在代码中添加 'Bearer '
```

### 问题 3: Token 无效

**症状：** 服务器日志显示 "JWT验证失败"

**解决方案：**
```javascript
// 1. 检查 token 是否有效
console.log('Token:', token)

// 2. 重新获取 token
wx.login({
  success: (res) => {
    // 使用 code 重新获取 token
    wx.request({
      url: 'http://localhost:3001/api/miniprogram/auth',
      method: 'POST',
      data: {
        code: res.code
      },
      success: (authRes) => {
        const newToken = authRes.data.token
        // 保存新 token
        wx.setStorageSync('userToken', newToken)
      }
    })
  }
})
```

### 问题 4: 网络连接问题

**症状：** 请求超时或连接失败

**解决方案：**
```javascript
// 1. 检查服务器是否运行
// 2. 检查端口是否正确
// 3. 检查防火墙设置

// 添加超时设置
wx.request({
  url: 'http://localhost:3001/api/user/profile',
  method: 'GET',
  timeout: 10000, // 10秒超时
  header: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  // ...
})
```

## 📋 测试清单

### 基础测试
- [ ] 服务器是否正在运行
- [ ] 端口 3001 是否可访问
- [ ] 调试接口是否响应
- [ ] Authorization 头是否正确传递

### 接口测试
- [ ] 简化版 profile 接口是否工作
- [ ] 简化版 stats 接口是否工作
- [ ] 完整版接口是否工作
- [ ] JWT 验证是否通过

### 微信小程序测试
- [ ] 网络请求是否成功
- [ ] Token 是否正确获取
- [ ] 错误处理是否完善
- [ ] 用户界面是否正常显示

## 🚀 快速修复建议

### 1. 临时解决方案
如果问题紧急，可以先使用简化版接口：

```javascript
// 将原来的接口地址改为简化版
const API_BASE = 'http://localhost:3001/api/user'

// 使用简化版接口
const profileUrl = API_BASE + '/profile-simple'
const statsUrl = API_BASE + '/stats-simple'
```

### 2. 完整解决方案
1. 检查微信小程序的 token 获取逻辑
2. 确保 token 格式正确
3. 验证 JWT_SECRET 环境变量
4. 检查数据库连接

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **服务器日志** - 完整的错误信息
2. **微信小程序代码** - 请求相关的代码片段
3. **网络请求详情** - 请求头和响应内容
4. **环境信息** - 操作系统、Node.js 版本等

## 🔄 下一步

1. 先测试调试接口
2. 再测试简化版接口
3. 最后测试完整版接口
4. 根据测试结果调整代码

这样可以逐步定位问题所在！ 