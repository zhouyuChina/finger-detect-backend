# 关于我们接口文档

## 接口概述

微信小程序端的"关于我们"接口，用于获取公司基本信息和应用版本信息。

## 接口详情

### 获取关于我们信息

- **接口地址**: `GET /api/miniprogram/about`
- **接口描述**: 获取公司基本信息和应用版本信息
- **认证方式**: Bearer Token 或 x-openid header
- **请求方式**: GET

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>  # 可选，使用JWT token认证
x-openid: <openid>            # 可选，使用openid认证
```

#### 请求参数

无

#### 响应格式

```json
{
  "success": true,
  "data": {
    "name": "公司名称",
    "logo": "公司Logo URL",
    "description": "公司描述",
    "address": "公司地址",
    "phone": "联系电话",
    "email": "联系邮箱",
    "website": "公司网站",
    "wechat": "微信公众号",
    "version": "应用版本号",
    "copyright": "版权信息"
  },
  "message": "获取关于我们信息成功",
  "code": 200
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | String | 公司名称 |
| logo | String | 公司Logo图片URL，可能为null |
| description | String | 公司描述信息 |
| address | String | 公司地址，可能为null |
| phone | String | 联系电话，可能为null |
| email | String | 联系邮箱，可能为null |
| website | String | 公司网站，可能为null |
| wechat | String | 微信公众号，可能为null |
| version | String | 应用版本号 |
| copyright | String | 版权信息 |

#### 响应示例

**成功响应**:
```json
{
  "success": true,
  "data": {
    "name": "指甲检测科技有限公司",
    "logo": "/uploads/logo.png",
    "description": "专业的指甲检测服务提供商，致力于为用户提供高质量的指甲检测和分析服务。我们拥有先进的技术设备和专业的检测团队，确保检测结果的准确性和可靠性。",
    "address": "北京市朝阳区建国门外大街1号国贸大厦A座1001室",
    "phone": "400-123-4567",
    "email": "contact@fingerdetect.com",
    "website": "https://www.fingerdetect.com",
    "wechat": "fingerdetect_service",
    "version": "1.0.0",
    "copyright": "© 2025 指甲检测科技有限公司. All rights reserved."
  },
  "message": "获取关于我们信息成功",
  "code": 200
}
```

**无公司数据时的默认响应**:
```json
{
  "success": true,
  "data": {
    "name": "指甲检测系统",
    "logo": null,
    "description": "专业的指甲检测服务提供商",
    "address": null,
    "phone": null,
    "email": null,
    "website": null,
    "wechat": null,
    "version": "1.0.0",
    "copyright": "© 2024 指甲检测系统. All rights reserved."
  },
  "message": "获取关于我们信息成功",
  "code": 200
}
```

## 使用示例

### JavaScript 示例

```javascript
// 使用 Bearer Token 认证
const getAboutInfo = async () => {
  const token = wx.getStorageSync('token')
  const response = await fetch('/api/miniprogram/about', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  return await response.json()
}

// 使用 openid 认证
const getAboutInfoWithOpenid = async (openid) => {
  const response = await fetch('/api/miniprogram/about', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-openid': openid
    }
  })
  return await response.json()
}

// 调用示例
const loadAboutInfo = async () => {
  try {
    const result = await getAboutInfo()
    if (result.success) {
      const aboutData = result.data
      console.log('公司名称:', aboutData.name)
      console.log('公司描述:', aboutData.description)
      console.log('联系电话:', aboutData.phone)
      console.log('应用版本:', aboutData.version)
    }
  } catch (error) {
    console.error('获取关于我们信息失败:', error)
  }
}
```

### 微信小程序示例

```javascript
// 在微信小程序页面中使用
Page({
  data: {
    aboutInfo: {}
  },
  
  onLoad() {
    this.loadAboutInfo()
  },
  
  async loadAboutInfo() {
    try {
      const token = wx.getStorageSync('token')
      const response = await wx.request({
        url: 'https://your-domain.com/api/miniprogram/about',
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        this.setData({
          aboutInfo: response.data.data
        })
      }
    } catch (error) {
      console.error('获取关于我们信息失败:', error)
    }
  }
})
```

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 成功 | - |
| 401 | 未授权访问 | 检查认证信息是否正确 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应示例

```json
{
  "success": false,
  "data": null,
  "message": "获取关于我们信息失败",
  "code": 500
}
```

## 注意事项

1. 该接口支持两种认证方式：Bearer Token 和 x-openid header
2. 如果数据库中没有公司信息，会返回默认的公司信息
3. 版本号和版权信息是动态生成的，版权信息会根据当前年份自动更新
4. 所有字段都可能为 null，前端需要做好空值处理
5. 建议在小程序启动时调用此接口，缓存公司信息

## 数据来源

- 公司信息来源于数据库中的 `companies` 表
- 如果没有公司数据，会返回默认的硬编码信息
- 版本号目前固定为 "1.0.0"，后续可以通过配置管理
- 版权信息会根据当前年份和公司名称动态生成 