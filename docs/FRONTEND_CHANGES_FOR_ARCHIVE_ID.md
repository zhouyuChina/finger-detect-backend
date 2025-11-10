# 小程序前端改造指引：统一使用 `archiveId`

> 目标：前端在所有档案/检测相关流程中只依赖不可变的 `archiveId`，可随时修改档案名称而不影响历史数据。

---

## 1. 变更概览

- **查询参数**：所有档案/检测接口现在都以 `archiveId` 为唯一关联键，后端不再根据 `archiveName` 去查数据。
- **数据一致性**：删除档案会自动清理其下检测记录，列表接口返回的 `id` 即 `archiveId`，可直接用于后续请求。
- **兼容性**：响应体仍然包含 `archiveName` 供展示，但不再需要由前端拼装或作为查询条件。

---

## 2. 各接口详情

### 2.1 GET `/api/miniprogram/all-archives`
- **请求**：无新增参数。
- **主要字段**（`ownArchives`/`otherArchives` 中每项）：
  - `id`：档案唯一 ID（后续所有操作都用它）。
  - `archiveName`：当前显示名称，可编辑。
  - `imageUrl` / `result` / `confidence` / `latestDetectionTime`：最新检测记录信息，通过 `archiveId` 获取，档案改名也不会丢。
- **前端动作**：
  - 切换详情、检测、删除等二级页面时，必须传递这一 `id`。
  - 若需要展示“本人档案”，仍可用返回的 `ownSubUserId` 判断。

### 2.2 GET `/api/miniprogram/archive-detections`
- **请求必填**：`archiveId`、`subUserId`，可选 `page`、`limit`。
- **响应**：
  - `report.archive`、`detections[]` 仍包含 `archiveName` 供展示。
  - `statistics.totalDetections`、分页信息等均以 `archiveId` 统计，不受改名影响。
- **前端动作**：路由/页面入参改为携带 `archiveId`，不再拼接 `archiveName`。

### 2.3 `/api/miniprogram/archives/:id`
- **GET**：通过 `id`（= `archiveId`）返回档案详情 + 最新检测图片。
- **PUT**：请求路径仍然是 `/archives/{archiveId}`，可以单独更新 `archiveName` 而不会影响检测记录。
- **DELETE**：直接删除档案即可，后端会自动级联删除其检测记录；前端无需再手动串行删除检测。

### 2.4 POST `/api/miniprogram/detection`
- **请求必填**：`subUserId`、`archiveId`、`imageUrl`，`archiveName` 不再用作查询。
- **逻辑**：
  - 若 `archiveId` 已有检测记录，仅累计 `photoCount`。
  - 若为首份报告，使用 `archiveId` 创建检测记录。
- **前端动作**：提交表单时只需携带 `archiveId`，无需再传档案名称。

### 2.5 POST `/api/miniprogram/detection-real`
- **请求必填**：`archiveId`、`subUserId`，其余字段不变。
- **逻辑**：
  - 所有统计（是否已有异常、总检测次数等）均按 `archiveId` 计算。
  - 新记录直接关联 `archiveId`，不会写入 `subUserId + archiveName` 组合键。
- **前端动作**：与普通检测相同，保证操作链路中始终携带 `archiveId`。

---

## 3. 前端改造清单

1. **状态管理**  
   - 模型/Store 中将 `archiveId` 作为主键字段，`archiveName` 仅作展示文案。
2. **网络层**  
   - 封装请求方法时，统一从档案列表/详情读取 `id` 作为 `archiveId` 参与 API 调用。
   - 删除档案时，直接请求 `DELETE /archives/{archiveId}`，无需额外删除检测。
3. **页面路由 & 参数**  
   - 档案详情、检测记录页、检测创建页等均从路由参数或页面状态中读取 `archiveId`。
   - 修改档案名称后，继续沿用同一个 `archiveId`，界面仅更新显示名称。
4. **类型定义（TS）**  
   - 如果有前端类型文件，确保 `Archive` 接口包含 `id: string` 并在相关 API 入参中要求 `archiveId: string`。
5. **回归测试**  
   - 场景：改名后查看/删除档案、创建检测、加载检测历史、批量上传图片等，全部验证以 `archiveId` 为准。

---

## 4. 常见问题

| 问题 | 处理方式 |
| --- | --- |
| 只拿到 `archiveName`，没有 `archiveId`？ | 先调用 `GET /api/miniprogram/all-archives` 或 `GET /api/miniprogram/archives/:id` 获取 `id`，再发起后续请求。 |
| 删除档案后是否需要刷新检测列表？ | 后端已级联删除，前端只需移除档案项并刷新本地缓存。 |
| 历史接口是否仍返回 `archiveName`？ | 是，展示不受影响，但禁止再把它作为查询条件。 |

如需补充字段或调试接口，请联系后端同步。***
