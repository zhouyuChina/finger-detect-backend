# 微信小程序优惠券API接口文档

## 概述

本文档描述了微信小程序端的优惠券相关API接口，目前只提供获取当前用户拥有的优惠券信息功能。

## 基础信息

- **基础URL**: `/api/miniprogram/coupons`
- **认证方式**: 微信小程序认证（需要openid）
- **数据格式**: JSON
- **字符编码**: UTF-8

## 接口列表

### 1. 获取当前用户拥有的优惠券信息

获取当前openid下用户拥有的所有优惠券信息。

**接口地址**: `GET /api/miniprogram/coupons`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| status | string | 否 | 状态筛选：used(已使用)、unused(未使用)、expired(已过期) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "user_coupon_id",
        "couponId": "coupon_id",
        "isUsed": false,
        "usedAt": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "status": "unused",
        "coupon": {
          "id": "coupon_id",
          "name": "新用户专享券",
          "code": "NEWUSER001",
          "type": "discount",
          "value": 10,
          "minAmount": 50,
          "maxDiscount": 20,
          "startTime": "2024-01-01T00:00:00Z",
          "endTime": "2024-12-31T23:59:59Z",
          "description": "新用户专享优惠券",
          "status": "active",
          "targetUsers": "new",
          "isExpired": false,
          "isActive": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误或用户信息不完整 |
| 401 | 认证失败 |
| 500 | 服务器内部错误 |

## 常见错误响应

### 用户信息不完整
```json
{
  "success": false,
  "message": "请先完善用户信息"
}
```

### 认证失败
```json
{
  "success": false,
  "message": "认证失败"
}
```

## 业务规则

1. **优惠券类型**:
   - `discount`: 满减券，按百分比计算优惠金额
   - `free`: 免费券，直接减免指定金额

2. **用户优惠券状态**:
   - `unused`: 未使用
   - `used`: 已使用
   - `expired`: 已过期

3. **时间限制**:
   - 只显示用户已拥有的优惠券
   - 自动计算优惠券是否过期

## 使用示例

### 微信小程序端调用示例

```javascript
// 获取用户优惠券列表
const getUserCoupons = async (page = 1, pageSize = 10, status = '') => {
  try {
    const response = await wx.request({
      url: 'https://your-domain.com/api/miniprogram/coupons',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        page,
        pageSize,
        status
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
  } catch (error) {
    console.error('获取优惠券失败:', error);
  }
};

// 获取未使用的优惠券
const getUnusedCoupons = async () => {
  return await getUserCoupons(1, 20, 'unused');
};

// 获取已使用的优惠券
const getUsedCoupons = async () => {
  return await getUserCoupons(1, 20, 'used');
};

// 获取已过期的优惠券
const getExpiredCoupons = async () => {
  return await getUserCoupons(1, 20, 'expired');
};
```

### 页面使用示例

```javascript
Page({
  data: {
    coupons: [],
    loading: false,
    currentStatus: 'unused' // unused, used, expired
  },

  onLoad() {
    this.loadCoupons();
  },

  // 加载优惠券
  async loadCoupons() {
    this.setData({ loading: true });
    
    try {
      const result = await getUserCoupons(1, 20, this.data.currentStatus);
      if (result) {
        this.setData({ 
          coupons: result.data || [],
          loading: false 
        });
      }
    } catch (error) {
      console.error('加载优惠券失败:', error);
      this.setData({ loading: false });
    }
  },

  // 切换状态
  switchStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ currentStatus: status });
    this.loadCoupons();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoupons().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
```

## 数据结构说明

### 用户优惠券对象
```javascript
{
  id: "用户优惠券ID",
  couponId: "优惠券ID", 
  isUsed: false, // 是否已使用
  usedAt: null, // 使用时间
  createdAt: "2024-01-01T00:00:00Z", // 领取时间
  status: "unused", // 状态：unused/used/expired
  coupon: {
    // 优惠券详细信息
    id: "优惠券ID",
    name: "优惠券名称",
    type: "discount", // 类型：discount/free
    value: 10, // 优惠值
    minAmount: 50, // 最低消费金额
    maxDiscount: 20, // 最大折扣金额
    startTime: "2024-01-01T00:00:00Z", // 开始时间
    endTime: "2024-12-31T23:59:59Z", // 结束时间
    description: "优惠券描述",
    isExpired: false, // 是否已过期
    isActive: true // 是否在有效期内
  }
}
```

## 注意事项

1. 该接口只返回当前用户已拥有的优惠券，不提供领取功能
2. 优惠券的领取功能由管理后台统一管理
3. 使用优惠券的功能暂时不提供
4. 所有时间字段均为ISO 8601格式
5. 状态筛选为可选参数，不传则返回所有状态的优惠券 