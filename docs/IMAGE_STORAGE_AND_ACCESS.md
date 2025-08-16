# 图片存储和访问机制

## 概述

当使用 `base64Image` 参数进行检测时，系统会自动处理图片的存储和访问问题。

## 图片存储机制

### 1. 检测时的图片处理

#### 使用 `imageUrl` 参数
- 图片URL直接保存到数据库
- 不进行额外的文件存储

#### 使用 `base64Image` 参数
- 图片会自动保存到服务器
- 保存路径：`public/uploads/detections/`
- 文件名格式：`detection_{subUserId}_{detectionType}_{timestamp}.jpg`
- 保存的URL格式：`/uploads/detections/detection_xxx_xxx_xxx.jpg`

### 2. 保存条件

图片只有在以下条件同时满足时才会保存：
- 使用 `base64Image` 参数
- 检测结果为 `onychomycosis`（灰指甲）
- 需要保存到数据库

### 3. 文件结构

```
public/
├── uploads/
│   ├── detections/           # 检测图片存储目录
│   │   ├── detection_cmedr5wi80006ef3amvqxgpl4_right_hand_index_1755388296587.jpg
│   │   ├── detection_cmee39t370008ef3aff2swssg_left_hand_thumb_1755388296588.jpg
│   │   └── ...
│   └── ...                   # 其他上传文件
```

## 图片访问机制

### 1. 直接访问（推荐）

图片保存后，可以通过以下方式直接访问：

```javascript
// 检测接口返回的imageUrl
const imageUrl = response.data.detection.imageUrl;
// 例如：/uploads/detections/detection_xxx_xxx_xxx.jpg

// 完整URL
const fullImageUrl = `http://47.76.126.85:4000${imageUrl}`;
```

### 2. 通过图片获取接口

如果直接访问有问题，可以使用专门的图片获取接口：

```javascript
// 获取图片
const imageResponse = await fetch(`/api/miniprogram/get-image?path=${imageUrl}`);
const imageBlob = await imageResponse.blob();
```

### 3. 前端使用示例

```javascript
// 方式1：直接显示图片
<image src={fullImageUrl} />

// 方式2：通过接口获取
const [imageData, setImageData] = useState(null);

useEffect(() => {
  if (detection.imageUrl) {
    fetch(`/api/miniprogram/get-image?path=${detection.imageUrl}`)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setImageData(url);
      });
  }
}, [detection.imageUrl]);
```

## 数据库字段说明

### Detection 表的 imageUrl 字段

- **使用 `imageUrl` 参数时**：保存原始图片URL
- **使用 `base64Image` 参数时**：保存服务器上的图片路径

### 示例数据

```javascript
// 使用 imageUrl 的情况
{
  "imageUrl": "http://47.76.126.85:4000/uploads/user_upload.jpg"
}

// 使用 base64Image 的情况
{
  "imageUrl": "/uploads/detections/detection_cmedr5wi80006ef3amvqxgpl4_right_hand_index_1755388296587.jpg"
}
```

## 安全考虑

### 1. 文件访问控制
- 只允许访问 `/uploads/` 目录下的文件
- 图片获取接口有权限验证

### 2. 文件类型限制
- 只支持常见图片格式：jpg, png, gif, webp
- 自动检测文件扩展名

### 3. 路径安全检查
- 防止目录遍历攻击
- 验证文件路径合法性

## 性能优化

### 1. 缓存策略
- 图片设置1年缓存时间
- 减少重复请求

### 2. 文件命名
- 使用时间戳避免文件名冲突
- 包含用户ID便于管理

### 3. 存储优化
- 按检测类型分类存储
- 便于后续清理和管理

## 清理策略

### 1. 自动清理
- 定期清理过期的检测图片
- 保留最近N个月的图片

### 2. 手动清理
- 提供管理接口删除特定图片
- 支持批量清理功能

## 注意事项

1. **存储空间**：检测图片会占用服务器存储空间
2. **备份策略**：重要图片需要定期备份
3. **访问权限**：确保图片访问接口的安全性
4. **性能影响**：大量图片可能影响服务器性能

## 故障排除

### 1. 图片无法访问
- 检查文件是否存在
- 验证文件路径是否正确
- 确认文件权限设置

### 2. 图片保存失败
- 检查磁盘空间
- 验证目录权限
- 查看服务器日志

### 3. 图片显示异常
- 检查Content-Type设置
- 验证图片文件完整性
- 确认前端访问方式
