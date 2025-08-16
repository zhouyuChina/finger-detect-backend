# 真实检测接口文档 (更新版)

## 接口地址
`POST /api/miniprogram/detection-real`

## 功能说明
调用真实的第三方AI检测服务进行指甲检测，支持两种图片输入方式。

## 请求参数

### 必填参数
- `subUserId` (string): 子用户ID
- `archiveId` (string): 档案ID

### 图片参数（二选一）
- `imageUrl` (string): 图片URL（仅支持可访问的完整URL）
- `base64Image` (string): base64编码的图片（推荐用于微信小程序）

### 可选参数
- `detectionType` (string): 检测类型，默认为 `left_hand_thumb`

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

### 方式1：使用base64图片（推荐）
```javascript
{
  "subUserId": "cmedr5wi80006ef3amvqxgpl4",
  "archiveId": "cmeewh1dz002mplcdfl0gekys",
  "detectionType": "right_hand_index",
  "base64Image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

### 方式2：使用图片URL
```javascript
{
  "subUserId": "cmedr5wi80006ef3amvqxgpl4",
  "archiveId": "cmeewh1dz002mplcdfl0gekys",
  "detectionType": "right_hand_index",
  "imageUrl": "http://47.76.126.85:4000/uploads/actual_image.jpg"
}
```

## 响应格式

### 成功响应
```javascript
{
  "success": true,
  "data": {
    "detection": {
      "id": "detection_id",
      "archiveName": "档案名称",
      "detectionType": "right_hand_index",
      "imageUrl": "图片URL",
      "result": "onychomycosis",
      "confidence": 0.95,
      "status": "completed",
      "remark": "检测备注",
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
      "imageUrl": "图片URL",
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

### 失败响应
```javascript
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "code": 400
}
```

## 检测结果说明

### 第三方服务返回结果
- `Normal`: 正常
- `onychomycosis`: 灰指甲
- `blurred`: 模糊图片
- `UNKNOWN`: 无法识别

### 数据库保存规则
- 只有 `onychomycosis` 结果会保存到数据库
- 其他结果只返回给前端，不保存

## 微信小程序使用建议

### 1. 直接使用base64（推荐）
```javascript
// 获取图片base64
wx.chooseImage({
  success: function(res) {
    const tempFilePath = res.tempFilePaths[0]
    
    // 转换为base64
    wx.getFileSystemManager().readFile({
      filePath: tempFilePath,
      encoding: 'base64',
      success: function(base64Res) {
        const base64Image = 'data:image/jpeg;base64,' + base64Res.data
        
        // 调用检测接口
        wx.request({
          url: '/api/miniprogram/detection-real',
          method: 'POST',
          data: {
            subUserId: 'xxx',
            archiveId: 'xxx',
            detectionType: 'right_hand_index',
            base64Image: base64Image
          },
          success: function(res) {
            console.log('检测结果:', res.data)
          }
        })
      }
    })
  }
})
```

### 2. 先上传再检测
```javascript
// 步骤1：上传图片
wx.request({
  url: '/api/miniprogram/upload-image',
  method: 'POST',
  data: {
    base64Image: base64Image,
    fileName: 'test.jpg'
  },
  success: function(uploadRes) {
    const imageUrl = uploadRes.data.data.imageUrl
    
    // 步骤2：调用检测接口
    wx.request({
      url: '/api/miniprogram/detection-real',
      method: 'POST',
      data: {
        subUserId: 'xxx',
        archiveId: 'xxx',
        detectionType: 'right_hand_index',
        imageUrl: imageUrl
      },
      success: function(detectionRes) {
        console.log('检测结果:', detectionRes.data)
      }
    })
  }
})
```

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
