# 仪表盘统计数据修复说明

## 问题描述
仪表盘的性别和年龄统计数据显示"未知"100%，因为查询了错误的数据表。

## 根本原因
- **错误做法**: 从 `wechat_user_verifications` (ID记录表) 获取性别和年龄数据
- **正确做法**: 应该从 `sub_users` (用户表) 获取性别和年龄数据

## 修复内容

### 修改的文件
`src/app/api/dashboard/stats/route.js`

### 具体变更

#### 1. 性别统计查询
```javascript
// 修改前 (错误)
const genderStats = await prisma.wechatUserVerification.groupBy({
  by: ['gender'],
  _count: { gender: true }
})

// 修改后 (正确)
const genderStats = await prisma.subUser.groupBy({
  by: ['gender'],
  _count: { gender: true }
})
```

#### 2. 年龄统计查询
```javascript
// 修改前 (错误)
const users = await prisma.wechatUserVerification.findMany({
  select: { age: true }
})

// 修改后 (正确)
const users = await prisma.subUser.findMany({
  select: { age: true }
})
```

### 保持不变的查询
以下查询保持不变，因为它们查询的是正确的表：
- 微信用户数: `prisma.wechatUserVerification.count()` ✅ (统计ID记录数)
- 用户数量: `prisma.subUser.count()` ✅ (统计用户数)
- 档案数量: `prisma.archive.count()` ✅ (统计档案数)

## 性别格式兼容性

代码已支持多种性别格式，自动转换为统一显示：

| 数据库中的值 | 显示为 |
|-------------|--------|
| 'male' | 男 |
| '男' | 男 |
| '1' | 男 |
| 1 (数字) | 男 |
| 'female' | 女 |
| '女' | 女 |
| '2' | 女 |
| 2 (数字) | 女 |
| 其他值 | 未知 (会被过滤掉) |

## 生产环境验证步骤

### 1. 部署前检查
在生产数据库中执行以下查询，确认 sub_users 表有数据：

```sql
-- 检查 sub_users 表总数
SELECT COUNT(*) FROM sub_users;

-- 检查性别分布
SELECT gender, COUNT(*) as count
FROM sub_users
GROUP BY gender;

-- 检查年龄分布
SELECT
  CASE
    WHEN age IS NULL THEN '无年龄'
    WHEN age < 18 THEN '18岁以下'
    WHEN age BETWEEN 18 AND 30 THEN '18-30岁'
    WHEN age BETWEEN 31 AND 40 THEN '31-40岁'
    WHEN age BETWEEN 41 AND 50 THEN '41-50岁'
    WHEN age BETWEEN 51 AND 60 THEN '51-60岁'
    ELSE '60岁以上'
  END as age_group,
  COUNT(*) as count
FROM sub_users
GROUP BY age_group;
```

### 2. 部署文件
只需要更新一个文件：
- `src/app/api/dashboard/stats/route.js`

### 3. 部署后验证
1. 登录管理后台
2. 访问仪表盘页面
3. 检查以下内容：
   - ✅ 性别分布饼图显示"男"和"女"，而不是"未知"
   - ✅ 年龄分布饼图显示各年龄段数据
   - ✅ 用户数量卡片显示正确的 sub_users 数量
   - ✅ 微信用户数显示正确的 wechat_user_verifications 数量

### 4. 如果仍然显示"未知"
可能的原因：
1. sub_users 表中的性别字段为空或 NULL
2. sub_users 表中的性别值使用了不支持的格式

调试方法：
```bash
# 运行调试脚本检查实际数据
node scripts/check-subuser-data.js
```

这将显示：
- sub_users 表的总记录数
- 各个性别值的分布情况
- 实际的性别值和类型
- 前10条记录示例

## API 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "wechatUserCount": 150,
    "subUserCount": 120,
    "archiveCount": 200,
    "genderData": [
      { "name": "男", "value": 70 },
      { "name": "女", "value": 50 }
    ],
    "ageData": [
      { "name": "18-30岁", "value": 40 },
      { "name": "31-40岁", "value": 50 },
      { "name": "41-50岁", "value": 30 }
    ]
  }
}
```

### 注意事项
- `genderData` 和 `ageData` 会自动过滤掉 `value: 0` 的项
- 如果某个年龄段或性别没有数据，不会出现在数组中
- 如果所有数据都为"未知"，这些项会被过滤掉，显示"暂无数据"

## 总结
此次修复将性别和年龄统计的数据源从 `wechat_user_verifications` 表正确修改为 `sub_users` 表，确保仪表盘显示的是真实用户的统计数据，而不是ID记录的统计数据。
