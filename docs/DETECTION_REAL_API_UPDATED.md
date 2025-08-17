# 真实检测接口文档 (更新版)

## 接口地址
`POST /api/miniprogram/detection-real`

## 功能说明
调用真实的第三方AI检测服务进行指甲检测，支持两种图片输入方式和检测模式。

## 请求参数

### 必填参数
- `subUserId` (string): 子用户ID
- `archiveId` (string): 档案ID

### 图片参数（二选一）
- `imageUrl` (string): 图片URL（仅支持可访问的完整URL）
- `base64Image` (string): base64编码的图片（推荐用于微信小程序）

### 可选参数
- `detectionType` (string): 检测类型，默认为 `left_hand_thumb`
- `needDetection` (boolean): 是否需要调用第三方AI检测服务，默认为 `true`

## 检测模式说明

### 模式1：AI检测模式（needDetection: true）
- 调用第三方AI检测服务
- 返回真实的检测结果
- 根据检测结果决定是否保存到数据库

### 模式2：仅保存模式（needDetection: false）
- 不调用第三方AI检测服务
- 仅保存图片到服务器
- 直接保存到数据库

## 支持的检测类型
```javascript
[
  'left_hand_thumb', 'left_hand_index', 'left_hand_middle', 'left_hand_ring', 'left_hand_little',
  'right_hand_thumb', 'right_hand_index', 'right_hand_middle', 'right_hand_ring', 'right_hand_little',
  'left_foot_big', 'left_foot_second', 'left_foot_third', 'left_foot_fourth', 'left_foot_little',
  'right_foot_big', 'right_foot_second', 'right_foot_third', 'right_foot_fourth', 'right_foot_little'
]
```

## 请求示例

### 方式1：AI检测模式（推荐首次检测）
```javascript
{
  "subUserId": "cmedr5wi80006ef3amvqxgpl4",
  "archiveId": "cmeewh1dz002mplcdfl0gekys",
  "detectionType": "right_hand_index",
  "base64Image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "needDetection": true  // 调用AI检测
}
```

### 方式2：仅保存模式（推荐后续拍照）
```javascript
{
  "subUserId": "cmedr5wi80006ef3amvqxgpl4",
  "archiveId": "cmeewh1dz002mplcdfl0gekys",
  "detectionType": "right_hand_index",
  "base64Image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "needDetection": false  // 仅保存图片
}
```

### 方式3：使用图片URL
```javascript
{
  "subUserId": "cmedr5wi80006ef3amvqxgpl4",
  "archiveId": "cmeewh1dz002mplcdfl0gekys",
  "detectionType": "right_hand_index",
  "imageUrl": "http://47.76.126.85:4000/uploads/actual_image.jpg",
  "needDetection": true
}
```

## 响应格式

### AI检测模式响应
```javascript
{
  "success": true,
  "data": {
    "detection": {
      "id": "detection_id",
      "archiveName": "档案名称",
      "detectionType": "right_hand_index",
      "imageUrl": "/uploads/detections/detection_xxx_xxx_xxx.jpg",
      "result": "onychomycosis",
      "confidence": 0.95,
      "status": "completed",
      "remark": "检测类型: right_hand_index, 最终结果: onychomycosis, 融合模型置信度: 95%",
      "detectionTime": "2025-08-16T15:30:00.000Z",
      "createdAt": "2025-08-16T15:30:00.000Z"
    },
    "thirdPartyResult": {
      "final_result": "onychomycosis",
      "model_results": {
        "fusion": {
          "confidence": "95%"
        }
      },
      "imageUrl": "/uploads/detections/detection_xxx_xxx_xxx.jpg",
      "detectionType": "right_hand_index",
      "timestamp": "2025-08-16T15:30:00.000Z"
    },
    "archive": {
      "id": "archive_id",
      "archiveName": "档案名称",
      "photoCount": 1,
      "detectionTime": "2025-08-16T15:30:00.000Z",
      "createdAt": "2025-08-16T15:30:00.000Z"
    },
    "isFirstReport": true,
    "shouldSaveToDatabase": true
  },
  "message": "检测完成，报告已生成"
}
```

### 仅保存模式响应
```javascript
{
  "success": true,
  "data": {
    "detection": {
      "id": "detection_id",
      "archiveName": "档案名称",
      "detectionType": "right_hand_index",
      "imageUrl": "/uploads/detections/detection_xxx_xxx_xxx.jpg",
      "result": "photo_only",
      "confidence": 0,
      "status": "completed",
      "remark": "检测类型: right_hand_index, 仅保存图片，未进行AI检测",
      "detectionTime": "2025-08-16T15:30:00.000Z",
      "createdAt": "2025-08-16T15:30:00.000Z"
    },
    "thirdPartyResult": {
      "final_result": "photo_only",
      "model_results": null,
      "imageUrl": "/uploads/detections/detection_xxx_xxx_xxx.jpg",
      "detectionType": "right_hand_index",
      "timestamp": "2025-08-16T15:30:00.000Z",
      "message": "仅保存图片，未进行AI检测"
    },
    "archive": {
      "id": "archive_id",
      "archiveName": "档案名称",
      "photoCount": 2,
      "detectionTime": "2025-08-16T15:30:00.000Z",
      "createdAt": "2025-08-16T15:30:00.000Z"
    },
    "isFirstReport": false,
    "shouldSaveToDatabase": true
  },
  "message": "图片保存完成"
}
```

## 检测结果说明

### 第三方服务返回结果（AI检测模式）
- `Normal`: 正常
- `onychomycosis`: 灰指甲
- `blurred`: 模糊图片
- `UNKNOWN`: 无法识别

### 仅保存模式结果
- `photo_only`: 仅保存图片，未进行AI检测

### 数据库保存规则
- AI检测模式：只有 `onychomycosis` 结果会保存到数据库
- 仅保存模式：所有图片都会保存到数据库

## 使用建议

### 前端调用策略
```javascript
// 首次检测：使用AI检测模式
const firstDetection = async (base64Image) => {
  const response = await wx.request({
    url: '/api/miniprogram/detection-real',
    method: 'POST',
    data: {
      subUserId: 'xxx',
      archiveId: 'xxx',
      detectionType: 'right_hand_index',
      base64Image: base64Image,
      needDetection: true  // 首次检测
    }
  });
  return response.data;
};

// 后续拍照：使用仅保存模式
const savePhoto = async (base64Image) => {
  const response = await wx.request({
    url: '/api/miniprogram/detection-real',
    method: 'POST',
    data: {
      subUserId: 'xxx',
      archiveId: 'xxx',
      detectionType: 'right_hand_index',
      base64Image: base64Image,
      needDetection: false  // 仅保存
    }
  });
  return response.data;
};
```

### 业务逻辑建议
1. **首次检测**：使用 `needDetection: true`，获取AI检测结果
2. **后续拍照**：使用 `needDetection: false`，仅保存图片
3. **定期检测**：可以设置时间间隔，定期使用AI检测模式

### 首次报告判断逻辑
- **isFirstReport** 字段基于当前档案中是否有异常（灰指甲）检测记录来判断
- 如果档案中没有任何异常记录，则 `isFirstReport: true`
- 如果档案中已有异常记录，则 `isFirstReport: false`
- 这个逻辑确保每次发现新的异常时都能正确标记为首次报告

#### 示例场景
1. **用户第一次拍照，检测正常**：`isFirstReport: false`（因为正常结果不保存）
2. **用户第二次拍照，检测为灰指甲**：`isFirstReport: true`（首次发现异常）
3. **用户第三次拍照，检测为灰指甲**：`isFirstReport: false`（已有异常记录）
4. **用户第四次拍照，检测正常**：`isFirstReport: false`（已有异常记录）

## 错误码说明

- `400`: 请求参数错误
- `404`: 用户或档案不存在
- `500`: 服务器内部错误

## 注意事项

1. **微信小程序临时文件**：`wxfile://` 和 `http://tmp/` 开头的URL无法从服务器访问，请使用 `base64Image` 参数
2. **图片大小**：建议图片大小不超过5MB
3. **base64格式**：支持带前缀和不带前缀的base64格式
4. **认证**：需要微信小程序认证
5. **权限**：只能操作当前用户下的子用户和档案
6. **性能优化**：仅保存模式可以显著减少第三方服务调用，提高性能
