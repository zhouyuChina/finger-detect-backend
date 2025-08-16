# 真实检测接口文档

## 概述

真实检测接口用于调用第三方AI检测服务进行灰指甲检测，根据检测结果决定是否保存到数据库。

**基础路径**: `/api/miniprogram/detection-real`

**认证方式**: 需要微信小程序认证（X-Openid 头部）

---

## 接口信息

### 创建真实检测记录

- **方法**: `POST`
- **路径**: `/api/miniprogram/detection-real`
- **描述**: 调用第三方AI检测服务进行灰指甲检测

### 请求参数

```json
{
  "subUserId": "cmdw3r532000splzxlhr67jtc",
  "archiveId": "cmdw3r532000splzxlhr67jtc",
  "detectionType": "left_hand_thumb",
  "imageUrl": "https://example.com/image.jpg"
}
```

### 请求字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| subUserId | string | 是 | 子用户ID (cuid) |
| archiveId | string | 是 | 档案ID (cuid) |
| detectionType | string | 否 | 检测类型，默认为 left_hand_thumb |
| imageUrl | string | 是 | 图片URL |

### 支持的检测类型

#### 手部检测
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

#### 脚部检测
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

### 支持的图片URL格式

- **HTTP/HTTPS URL**: `https://example.com/image.jpg`
- **相对路径**: `/uploads/image.jpg`
- **微信小程序临时文件**: `wxfile://tmp_xxxxxxxxxxxx.jpg`

---

## 第三方检测服务

### 服务地址
- **URL**: `http://localhost:1008/predict`
- **方法**: `POST`
- **内容类型**: `application/json`

### 请求格式
```json
{
  "base64_img": "base64编码的图片数据"
}
```

### 响应格式
```json
{
  "final_result": "onychomycosis",
  "model_results": {
    "fusion": {
      "result": "onychomycosis",
      "confidence": "95.67%"
    },
    "densenet": {
      "result": "onychomycosis",
      "confidence": "92.34%"
    }
  }
}
```

### 检测结果说明

| 结果值 | 说明 | 是否落库 |
|--------|------|----------|
| Normal | 正常 | ❌ 不落库 |
| onychomycosis | 灰指甲 | ✅ 落库 |
| blurred | 模糊图片 | ❌ 不落库 |
| UNKNOWN | 无法识别 | ❌ 不落库 |

---

## 响应示例

### 灰指甲检测结果（需要落库）

```json
{
  "success": true,
  "message": "检测完成，报告已生成",
  "data": {
    "detection": {
      "id": "cmdw3r532000splzxlhr67jtc",
      "archiveName": "张三检测1",
      "detectionType": "left_hand_thumb",
      "imageUrl": "https://example.com/image.jpg",
      "result": "onychomycosis",
      "confidence": 0.9567,
      "status": "completed",
      "remark": "检测类型: left_hand_thumb, 最终结果: onychomycosis, 融合模型置信度: 95.67%",
      "detectionTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "thirdPartyResult": {
      "final_result": "onychomycosis",
      "model_results": {
        "fusion": {
          "result": "onychomycosis",
          "confidence": "95.67%"
        },
        "densenet": {
          "result": "onychomycosis",
          "confidence": "92.34%"
        }
      },
      "imageUrl": "https://example.com/image.jpg",
      "detectionType": "left_hand_thumb",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "archive": {
      "id": "cmdw3r532000splzxlhr67jtc",
      "archiveName": "张三检测1",
              "photoCount": 1, // 创建第一个检测记录后，照片数量为1
      "detectionTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "isFirstReport": true,
    "shouldSaveToDatabase": true
  }
}
```

### 正常检测结果（不落库）

```json
{
  "success": true,
  "message": "检测完成，结果已返回",
  "data": {
    "detection": null,
    "thirdPartyResult": {
      "final_result": "Normal",
      "model_results": {
        "fusion": {
          "result": "normal",
          "confidence": "99.31%"
        },
        "densenet": {
          "result": "normal",
          "confidence": "98.39%"
        }
      },
      "imageUrl": "https://example.com/image.jpg",
      "detectionType": "left_hand_thumb",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "archive": null,
    "isFirstReport": false,
    "shouldSaveToDatabase": false
  }
}
```

### 模糊图片检测结果（不落库）

```json
{
  "success": true,
  "message": "检测完成，结果已返回",
  "data": {
    "detection": null,
    "thirdPartyResult": {
      "final_result": "blurred",
      "model_results": {
        "fusion": {
          "result": "blurred",
          "confidence": "85.23%"
        },
        "densenet": {
          "result": "blurred",
          "confidence": "82.67%"
        }
      },
      "imageUrl": "https://example.com/image.jpg",
      "detectionType": "left_hand_thumb",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "archive": null,
    "isFirstReport": false,
    "shouldSaveToDatabase": false
  }
}
```

---

## 响应字段说明

### detection 字段（仅当 shouldSaveToDatabase 为 true 时存在）
- `id`: 检测记录唯一标识符 (cuid)
- `archiveName`: 档案名称
- `detectionType`: 检测类型
- `imageUrl`: 图片URL
- `result`: 检测结果
- `confidence`: 置信度 (0-1)
- `status`: 检测状态
- `remark`: 备注信息
- `detectionTime`: 检测时间
- `createdAt`: 创建时间

### thirdPartyResult 字段
- `final_result`: 最终检测结果
- `model_results`: 各模型的检测结果
- `imageUrl`: 检测的图片URL
- `detectionType`: 检测类型
- `timestamp`: 检测时间戳

### archive 字段（仅当 shouldSaveToDatabase 为 true 时存在）
- `id`: 档案唯一标识符 (cuid)
- `archiveName`: 档案名称
- `photoCount`: 照片数量
- `detectionTime`: 检测时间
- `createdAt`: 创建时间

### 其他字段
- `isFirstReport`: 是否为第一份报告
- `shouldSaveToDatabase`: 是否需要保存到数据库

---

## 业务逻辑说明

### 1. 用户验证
- 接口首先根据 openid 和 subUserId 验证用户权限
- 确保只有该微信用户下的子用户才能进行检测

### 2. 图片处理
- 将图片URL转换为base64格式
- 支持多种图片URL格式（HTTP/HTTPS、相对路径、微信临时文件）

### 3. 第三方服务调用
- 调用 `http://localhost:1008/predict` 接口
- 传递base64编码的图片数据
- 获取AI检测结果

### 4. 结果处理
- 根据 `final_result` 判断是否需要落库
- 只有 `onychomycosis` 结果才会保存到数据库
- 其他结果（Normal、blurred、UNKNOWN）直接返回给前端

### 5. 数据存储
- 当结果为灰指甲时，创建检测记录
- 更新档案的检测统计信息
- 标记是否为第一份报告

---

## 错误处理

### 常见错误响应

#### 400 - 参数错误
```json
{
  "success": false,
  "message": "子用户ID、档案ID和图片URL为必填项"
}
```

#### 404 - 用户或档案不存在
```json
{
  "success": false,
  "message": "用户不存在或无权限操作"
}
```

#### 500 - 第三方服务错误
```json
{
  "success": false,
  "message": "第三方检测服务调用失败: Connection refused"
}
```

---

## 使用示例

### 微信小程序调用示例

```javascript
// 创建真实检测记录
wx.request({
  url: 'https://your-domain.com/api/miniprogram/detection-real',
  method: 'POST',
  header: {
    'X-Openid': wx.getStorageSync('openid'),
    'Content-Type': 'application/json'
  },
  data: {
    subUserId: 'cmdw3r532000splzxlhr67jtc',
    archiveId: 'cmdw3r532000splzxlhr67jtc',
    detectionType: 'left_hand_thumb',
    imageUrl: 'https://example.com/image.jpg'
  },
  success: function(res) {
    if (res.data.success) {
      const data = res.data.data;
      
      if (data.shouldSaveToDatabase) {
        console.log('检测结果为灰指甲，已保存到数据库');
        console.log('检测记录:', data.detection);
        console.log('档案信息:', data.archive);
      } else {
        console.log('检测结果不需要保存:', data.thirdPartyResult.final_result);
      }
      
      // 显示检测结果
      wx.showModal({
        title: '检测完成',
        content: `检测结果: ${data.thirdPartyResult.final_result}`,
        showCancel: false
      });
    } else {
      console.error('检测失败:', res.data.message);
    }
  },
  fail: function(error) {
    console.error('请求失败:', error);
  }
});
```

---

## 注意事项

1. **认证要求**: 所有接口都需要提供有效的 `X-Openid` 头部
2. **用户权限**: 只能操作自己微信用户下的子用户检测
3. **图片格式**: 支持多种图片URL格式，自动转换为base64
4. **落库条件**: 只有灰指甲检测结果才会保存到数据库
5. **第三方服务**: 需要确保 `http://localhost:1008/predict` 服务正常运行
6. **网络延迟**: 第三方服务调用可能需要几秒钟时间
7. **错误处理**: 第三方服务异常时会返回相应的错误信息
