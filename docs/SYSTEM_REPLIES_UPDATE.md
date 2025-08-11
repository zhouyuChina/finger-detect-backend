# 系统消息页面修改说明

## 修改概述

本次修改对系统消息管理页面进行了重大重构，主要包括：

1. **状态简化**：将状态从四种（草稿、已发布、已过期、已作废）简化为两种（未发布、已发布）
2. **页面重构**：将新增、查看、编辑功能统一到一个新页面中，提升用户体验
3. **功能简化**：去掉总阅读率展示和身份相关内容，目前只针对所有微信账号
4. **接口预留**：为未来指定微信账号发送消息预留接口

## 详细修改内容

### 1. 状态字段修改

#### 数据库层面
- 更新了 `prisma/schema.prisma` 中 `SystemReply` 模型的 `status` 字段默认值
- 从 `@default("draft")` 改为 `@default("unpublished")`
- 创建了新的数据库迁移：`20250811213756_update_system_reply_status_default`

#### API 层面
- 更新了 `/api/system-replies` 路由中的状态验证
- 将有效状态从 `['draft', 'published', 'expired', 'cancelled']` 改为 `['unpublished', 'published']`
- 更新了默认状态值

#### 前端层面
- 更新了状态徽章显示逻辑
- 修改了搜索条件中的状态选项
- 更新了统计卡片显示

### 2. 页面重构

#### 新增统一表单页面
- 创建了 `/system-replies/form` 页面
- 支持三种模式：`add`（新增）、`edit`（编辑）、`view`（查看）
- 通过 URL 参数 `mode` 和 `id` 控制页面行为

#### 主页面优化
- 移除了所有模态框相关代码
- 简化了状态管理
- 更新了操作按钮，现在跳转到统一表单页面
- 添加了搜索和重置按钮

### 3. 功能简化

#### 去掉总阅读率展示
- 移除了统计卡片中的"总阅读率"显示
- 统计卡片从4个减少到3个：总消息数、未发布、已发布

#### 去掉身份相关内容
- 移除了搜索条件中的"身份"筛选
- 移除了表格中的"身份"列
- 移除了表单中的"目标用户"选择
- 所有系统消息目前只针对所有微信账号（`targetUsers: 'all'`）

### 4. 发送消息接口预留

#### 新增数据库模型
- 创建了 `SystemReplySendRecord` 模型来记录发送历史
- 支持指定微信账号发送和全部用户发送
- 包含发送状态、计划时间、实际发送时间等字段

#### 新增 API 接口
- `POST /api/system-replies/send` - 发送系统消息
- `GET /api/system-replies/send` - 获取发送记录

#### 接口功能
- 支持发送给指定微信账号（通过 openId 数组）
- 支持发送给所有用户（空数组）
- 支持立即发送和计划发送
- 记录发送状态和错误信息

### 5. 功能特性

#### 统一表单页面特性
- **响应式设计**：适配不同屏幕尺寸
- **模式切换**：根据 mode 参数显示不同的表单状态
- **表单验证**：必填字段验证
- **状态管理**：加载状态、提交状态、错误处理
- **导航**：返回列表功能

#### 状态管理
- **未发布**：灰色徽章，表示草稿状态
- **已发布**：绿色徽章，表示已发布状态
- **自动发布时间**：当状态从未发布改为已发布时，自动设置发布时间

## 文件结构

```
src/app/system-replies/
├── page.js                    # 主列表页面（已重构）
└── form/
    └── page.js               # 统一表单页面（新增）

src/app/api/system-replies/
├── route.js                  # 系统消息 CRUD API
├── [id]/route.js            # 单个系统消息操作
└── send/route.js            # 发送消息 API（新增）
```

## API 端点

### 系统消息管理
- `GET /api/system-replies` - 获取系统消息列表
- `POST /api/system-replies` - 创建系统消息
- `GET /api/system-replies/[id]` - 获取单个系统消息
- `PUT /api/system-replies/[id]` - 更新系统消息
- `DELETE /api/system-replies/[id]` - 删除系统消息

### 发送消息（预留接口）
- `POST /api/system-replies/send` - 发送系统消息
- `GET /api/system-replies/send` - 获取发送记录

## 使用方式

### 新增系统消息
```
/system-replies/form?mode=add
```

### 编辑系统消息
```
/system-replies/form?mode=edit&id=[消息ID]
```

### 查看系统消息
```
/system-replies/form?mode=view&id=[消息ID]
```

### 发送系统消息（API）
```javascript
// 发送给所有用户
POST /api/system-replies/send
{
  "systemReplyId": "消息ID",
  "targetOpenIds": [],
  "sendImmediately": true
}

// 发送给指定用户
POST /api/system-replies/send
{
  "systemReplyId": "消息ID",
  "targetOpenIds": ["openId1", "openId2"],
  "sendImmediately": false
}
```

## 测试验证

创建了测试脚本 `scripts/test-system-replies.js` 来验证 API 功能：
- ✅ 获取系统消息列表
- ✅ 创建系统消息
- ✅ 获取单个系统消息
- ✅ 更新系统消息
- ✅ 发送系统消息（接口预留）
- ✅ 获取发送记录
- ✅ 删除系统消息

## 未来扩展计划

### 微信消息发送功能
1. **实现微信 API 集成**
   - 集成微信小程序消息推送 API
   - 实现模板消息发送
   - 处理发送失败重试机制

2. **用户管理功能**
   - 添加用户选择界面
   - 支持按标签、分组筛选用户
   - 实现用户导入导出功能

3. **发送计划功能**
   - 支持定时发送
   - 发送进度跟踪
   - 发送结果统计

## 兼容性说明

- 现有数据中的 `draft` 状态在显示时会显示为 `未发布`
- 建议在部署后手动更新现有数据的状态值
- API 仍然接受旧的状态值，但会建议使用新的状态值
- 身份相关字段保留在数据库中，但不再在前端显示

## 部署注意事项

1. 运行数据库迁移：`npx prisma migrate deploy`
2. 重启应用服务器
3. 验证新页面功能正常
4. 检查现有数据的状态显示
5. 测试发送消息接口（目前只记录，不实际发送）
