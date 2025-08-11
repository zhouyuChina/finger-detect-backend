# ExcelExporter 组件使用说明

## 概述

`ExcelExporter` 是一个通用的Excel导出组件，支持将表格数据导出为Excel文件。该组件提供了两种使用方式：组件方式和函数方式。

## 组件方式使用

### 基本用法

```jsx
import ExcelExporter from '@/components/ExcelExporter'

// 在组件中使用
function MyComponent() {
  const headers = ['姓名', '年龄', '性别']
  const data = [
    ['张三', 25, '男'],
    ['李四', 30, '女'],
    ['王五', 28, '男']
  ]

  return (
    <ExcelExporter
      headers={headers}
      data={data}
      filename="用户数据"
      sheetName="用户信息"
    />
  )
}
```

### 完整参数示例

```jsx
<ExcelExporter
  headers={['序号', '姓名', '年龄', '性别']}
  data={[
    [1, '张三', 25, '男'],
    [2, '李四', 30, '女']
  ]}
  filename="用户数据"
  sheetName="用户信息"
  columnWidths={[
    { wch: 8 },   // 序号
    { wch: 15 },  // 姓名
    { wch: 10 },  // 年龄
    { wch: 10 }   // 性别
  ]}
  buttonText="导出Excel"
  buttonClassName="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
  onSuccess={(filename) => console.log(`导出成功：${filename}`)}
  onError={(error) => console.error(`导出失败：${error.message}`)}
/>
```

## 函数方式使用

### 基本用法

```jsx
import { exportToExcel } from '@/components/ExcelExporter'

// 在函数中使用
async function handleExport() {
  try {
    const options = {
      headers: ['姓名', '年龄', '性别'],
      data: [
        ['张三', 25, '男'],
        ['李四', 30, '女']
      ],
      filename: '用户数据',
      sheetName: '用户信息'
    }
    
    const filename = await exportToExcel(options)
    console.log(`导出成功：${filename}`)
  } catch (error) {
    console.error(`导出失败：${error.message}`)
  }
}
```

### 完整参数示例

```jsx
const options = {
  headers: ['序号', '姓名', '年龄', '性别'],
  data: [
    [1, '张三', 25, '男'],
    [2, '李四', 30, '女']
  ],
  filename: '用户数据',
  sheetName: '用户信息',
  columnWidths: [
    { wch: 8 },   // 序号
    { wch: 15 },  // 姓名
    { wch: 10 },  // 年龄
    { wch: 10 }   // 性别
  ]
}

const filename = await exportToExcel(options)
```

## 参数说明

### ExcelExporter 组件参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| headers | Array | 是 | - | 表头数组 |
| data | Array | 是 | - | 数据数组，每个元素是一个数组 |
| filename | string | 是 | - | 文件名（不包含扩展名） |
| sheetName | string | 否 | '数据' | 工作表名称 |
| columnWidths | Array | 否 | [] | 列宽数组 |
| buttonText | string | 否 | '导出Excel' | 按钮文字 |
| buttonClassName | string | 否 | 'bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700' | 按钮样式类名 |
| onSuccess | Function | 否 | - | 成功回调函数 |
| onError | Function | 否 | - | 错误回调函数 |

### exportToExcel 函数参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| headers | Array | 是 | - | 表头数组 |
| data | Array | 是 | - | 数据数组 |
| filename | string | 是 | - | 文件名 |
| sheetName | string | 否 | '数据' | 工作表名称 |
| columnWidths | Array | 否 | [] | 列宽数组 |

## 列宽设置

列宽使用 `wch` 属性设置，数值越大列越宽：

```jsx
const columnWidths = [
  { wch: 8 },   // 窄列（如序号）
  { wch: 15 },  // 中等列（如姓名）
  { wch: 30 },  // 宽列（如长文本）
  { wch: 10 }   // 标准列
]
```

## 文件名格式

导出的文件名格式为：`{filename}_{timestamp}.xlsx`

例如：`用户数据_2024-01-15T10-30-45.xlsx`

## 错误处理

组件会自动处理以下错误：
- 参数验证错误
- Excel生成错误
- 文件下载错误

可以通过 `onError` 回调或 `exportToExcel` 的 Promise reject 来捕获错误。

## 使用场景

1. **表格数据导出**：将页面表格数据导出为Excel
2. **报表生成**：生成各种统计报表
3. **数据备份**：备份重要数据
4. **数据分享**：将数据分享给其他用户

## 注意事项

1. 确保 `headers` 和 `data` 的列数一致
2. `data` 中的每个元素必须是数组
3. 文件名会自动添加时间戳，避免重复
4. 组件依赖 `xlsx` 库，确保已安装
