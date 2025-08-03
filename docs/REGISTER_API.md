# 微信小程序注册/登录接口文档

## 接口信息

- **接口地址**: `/api/miniprogram/register`
- **请求方法**: `POST`
- **Content-Type**: `application/json`
- **功能**: 微信小程序用户注册/登录统一接口

## 请求参数

### 请求体 (JSON)

```json
{
  "code": "微信登录code",
  "userInfo": {
    "nickName": "微信昵称",
    "gender": 0,
    "language": "",
    "city": "",
    "province": "",
    "country": "",
    "avatarUrl": "头像URL",
    "is_demote": true
  },
  "systemInfo": {
    "platform": "devtools",
    "system": "iOS 10.0.1",
    "version": "8.0.5",
    "SDKVersion": "3.8.7",
    "brand": "devtools",
    "model": "iPhone 12/13 (Pro)",
    "screenWidth": 390,
    "screenHeight": 844,
    "windowWidth": 390,
    "windowHeight": 753,
    "pixelRatio": 3,
    "language": "zh_CN"
  },
  "registerTime": "2025-08-03T22:57:16.250Z",
  "appVersion": "1.0.0"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `code` | string | 是 | 微信登录code，用于换取openid |
| `userInfo` | object | 是 | 微信用户信息 |
| `userInfo.nickName` | string | 是 | 微信昵称 |
| `userInfo.gender` | number | 否 | 性别：0-未知，1-男，2-女 |
| `userInfo.language` | string | 否 | 语言 |
| `userInfo.city` | string | 否 | 城市 |
| `userInfo.province` | string | 否 | 省份 |
| `userInfo.country` | string | 否 | 国家 |
| `userInfo.avatarUrl` | string | 否 | 头像URL |
| `userInfo.is_demote` | boolean | 否 | 是否降级用户 |
| `systemInfo` | object | 否 | 系统信息 |
| `systemInfo.platform` | string | 否 | 平台 |
| `systemInfo.system` | string | 否 | 系统版本 |
| `systemInfo.version` | string | 否 | 微信版本 |
| `systemInfo.SDKVersion` | string | 否 | SDK版本 |
| `systemInfo.brand` | string | 否 | 设备品牌 |
| `systemInfo.model` | string | 否 | 设备型号 |
| `systemInfo.screenWidth` | number | 否 | 屏幕宽度 |
| `systemInfo.screenHeight` | number | 否 | 屏幕高度 |
| `systemInfo.windowWidth` | number | 否 | 窗口宽度 |
| `systemInfo.windowHeight` | number | 否 | 窗口高度 |
| `systemInfo.pixelRatio` | number | 否 | 像素比 |
| `systemInfo.language` | string | 否 | 语言 |
| `registerTime` | string | 否 | 注册时间（ISO格式） |
| `appVersion` | string | 否 | 应用版本 |

### 兼容旧版本参数

```json
{
  "openid": "直接传入的openid",
  "nickname": "用户昵称",
  "avatar": "头像URL",
  "gender": 1,
  "city": "城市",
  "province": "省份",
  "country": "国家",
  "appVersion": "1.0.0"
}
```

## 响应格式

### 成功响应 (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmdw1yhuq0007plzxvymv80fj",
      "openid": "oJxdMvo4dM2s4FHkuZqoucCJavnU",
      "nickname": "微信用户",
      "subUsers": [
        {
          "id": "cmdw3r532000splzxlhr67jtc",
          "wechatUserId": "cmdw1yhuq0007plzxvymv80fj",
          "username": "新用户",
          "realName": "新用户",
          "phone": null,
          "email": null,
          "age": 21,
          "gender": null,
          "address": "北京市北京市 丰台区",
          "status": "active",
          "archives": 0,
          "photos": 0,
          "reports": 0,
          "remark": null,
          "createdAt": "2025-08-03T19:56:43.262Z",
          "updatedAt": "2025-08-03T19:56:43.262Z",
          "isActive": true
        },
        {
          "id": "cmdw46k8i000wplzxhaj597pv",
          "wechatUserId": "cmdw1yhuq0007plzxvymv80fj",
          "username": "孙悟空",
          "realName": "孙悟空",
          "phone": null,
          "email": null,
          "age": 21,
          "gender": null,
          "address": "北京市北京市丰台区",
          "status": "active",
          "archives": 2,
          "photos": 0,
          "reports": 3,
          "remark": null,
          "createdAt": "2025-08-03T20:08:42.739Z",
          "updatedAt": "2025-08-03T22:24:15.036Z",
          "isActive": true
        }
      ],
      "currentSubUser": {
        "id": "cmdw3r532000splzxlhr67jtc",
        "wechatUserId": "cmdw1yhuq0007plzxvymv80fj",
        "username": "新用户",
        "realName": "新用户",
        "phone": null,
        "email": null,
        "age": 21,
        "gender": null,
        "address": "北京市北京市 丰台区",
        "status": "active",
        "archives": 0,
        "photos": 0,
        "reports": 0,
        "remark": null,
        "createdAt": "2025-08-03T19:56:43.262Z",
        "updatedAt": "2025-08-03T19:56:43.262Z",
        "isActive": true
      }
    }
  },
  "message": "用户登录成功",
  "code": 200
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `success` | boolean | 请求是否成功 |
| `data.user.id` | string | 微信用户ID |
| `data.user.openid` | string | 微信openid |
| `data.user.nickname` | string | 微信昵称 |
| `data.user.subUsers` | array | 子用户列表 |
| `data.user.subUsers[].id` | string | 子用户ID |
| `data.user.subUsers[].username` | string | 子用户用户名 |
| `data.user.subUsers[].realName` | string | 子用户真实姓名 |
| `data.user.subUsers[].phone` | string | 子用户手机号 |
| `data.user.subUsers[].email` | string | 子用户邮箱 |
| `data.user.subUsers[].age` | number | 子用户年龄 |
| `data.user.subUsers[].gender` | string | 子用户性别 |
| `data.user.subUsers[].address` | string | 子用户地址 |
| `data.user.subUsers[].status` | string | 子用户状态 |
| `data.user.subUsers[].archives` | number | 建档数量 |
| `data.user.subUsers[].photos` | number | 拍照数量 |
| `data.user.subUsers[].reports` | number | 报告数量 |
| `data.user.subUsers[].createdAt` | string | 创建时间 |
| `data.user.subUsers[].updatedAt` | string | 更新时间 |
| `data.user.subUsers[].isActive` | boolean | 是否激活 |
| `data.user.currentSubUser` | object | 当前选中的子用户（同subUsers结构） |
| `message` | string | 响应消息 |
| `code` | number | 响应状态码 |

### 错误响应

#### 400 Bad Request - 参数错误

```json
{
  "success": false,
  "data": null,
  "message": "openid为必填项",
  "code": 400
}
```

#### 400 Bad Request - 微信登录失败

```json
{
  "success": false,
  "data": null,
  "message": "微信登录失败: 微信API错误: 40029 - invalid code",
  "code": 400
}
```

#### 400 Bad Request - 账号已注册

```json
{
  "success": false,
  "data": null,
  "message": "该微信账号已被注册",
  "code": 400
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "data": null,
  "message": "用户注册失败: 具体错误信息",
  "code": 500
}
```

## 使用示例

### JavaScript/TypeScript

```javascript
// 微信小程序登录
wx.login({
  success: (res) => {
    const code = res.code
    
    // 获取用户信息
    wx.getUserInfo({
      success: (userInfoRes) => {
        // 调用注册接口
        wx.request({
          url: 'http://your-domain.com/api/miniprogram/register',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            code: code,
            userInfo: userInfoRes.userInfo,
            systemInfo: wx.getSystemInfoSync(),
            registerTime: new Date().toISOString(),
            appVersion: '1.0.0'
          },
          success: (response) => {
            if (response.data.success) {
              const user = response.data.data.user
              console.log('登录成功:', user.nickname)
              console.log('OpenID:', user.openid)
              console.log('子用户数量:', user.subUsers.length)
              console.log('当前子用户:', user.currentSubUser)
              
              // 保存用户信息
              wx.setStorageSync('user', user)
              wx.setStorageSync('openid', user.openid)
            } else {
              console.error('登录失败:', response.data.message)
            }
          },
          fail: (error) => {
            console.error('请求失败:', error)
          }
        })
      }
    })
  }
})
```

### Fetch API

```javascript
const response = await fetch('/api/miniprogram/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: '微信登录code',
    userInfo: {
      nickName: '微信用户',
      gender: 0,
      avatarUrl: 'https://example.com/avatar.jpg'
    },
    systemInfo: {
      platform: 'devtools',
      system: 'iOS 10.0.1'
    },
    appVersion: '1.0.0'
  })
})

const result = await response.json()

if (result.success) {
  const user = result.data.user
  console.log('用户信息:', user)
  console.log('OpenID:', user.openid)
  console.log('子用户列表:', user.subUsers)
} else {
  console.error('错误:', result.message)
}
```

## 注意事项

1. **必填字段**: `code` 或 `openid` 至少提供一个
2. **微信登录**: 优先使用 `code` 进行微信登录
3. **兼容性**: 支持直接传入 `openid`（旧版本兼容）
4. **子用户管理**: 每个微信用户可以有多个子用户
5. **默认子用户**: 系统会自动创建代表用户本人的子用户
6. **认证方式**: 使用 `openid` 进行后续API认证，不再使用JWT token

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查必填字段是否完整 |
| 400 | 微信登录失败 | 检查微信配置和网络连接 |
| 400 | 账号已注册 | 该微信账号已被其他用户使用 |
| 500 | 服务器错误 | 联系技术支持 |

## 更新日志

- **v2.0**: 支持子用户管理，移除JWT token
- **v1.0**: 基础微信登录功能，返回JWT token 