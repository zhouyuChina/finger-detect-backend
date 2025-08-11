'use client'
import * as XLSX from 'xlsx'

/**
 * 通用Excel导出组件
 * @param {Object} props
 * @param {Array} props.headers - 表头数组
 * @param {Array} props.data - 数据数组，每个元素是一个数组
 * @param {string} props.filename - 文件名（不包含扩展名）
 * @param {string} props.sheetName - 工作表名称
 * @param {Array} props.columnWidths - 列宽数组，可选
 * @param {string} props.buttonText - 按钮文字
 * @param {string} props.buttonClassName - 按钮样式类名
 * @param {Function} props.onSuccess - 成功回调
 * @param {Function} props.onError - 错误回调
 */
export default function ExcelExporter({
  headers,
  data,
  filename,
  sheetName = '数据',
  columnWidths = [],
  buttonText = '导出Excel',
  buttonClassName = 'bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700',
  onSuccess,
  onError
}) {
  const handleExport = () => {
    try {
      // 验证参数
      if (!headers || !Array.isArray(headers)) {
        throw new Error('表头必须是数组')
      }
      if (!data || !Array.isArray(data)) {
        throw new Error('数据必须是数组')
      }
      if (!filename) {
        throw new Error('文件名不能为空')
      }

      // 组合表头和数据
      const worksheetData = [headers, ...data]

      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // 设置列宽（如果提供）
      if (columnWidths && columnWidths.length > 0) {
        worksheet['!cols'] = columnWidths
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // 生成文件名
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
      const fullFilename = `${filename}_${timestamp}.xlsx`

      // 导出文件
      XLSX.writeFile(workbook, fullFilename)

      // 成功回调
      if (onSuccess) {
        onSuccess(fullFilename)
      } else {
        alert('导出成功！')
      }
    } catch (error) {
      console.error('导出失败:', error)
      
      // 错误回调
      if (onError) {
        onError(error)
      } else {
        alert(`导出失败：${error.message}`)
      }
    }
  }

  return (
    <button 
      onClick={handleExport}
      className={buttonClassName}
    >
      {buttonText}
    </button>
  )
}

/**
 * 导出Excel的工具函数（不包含UI组件）
 * @param {Object} options
 * @param {Array} options.headers - 表头数组
 * @param {Array} options.data - 数据数组
 * @param {string} options.filename - 文件名
 * @param {string} options.sheetName - 工作表名称
 * @param {Array} options.columnWidths - 列宽数组
 * @returns {Promise<void>}
 */
export const exportToExcel = async (options) => {
  const {
    headers,
    data,
    filename,
    sheetName = '数据',
    columnWidths = []
  } = options

  return new Promise((resolve, reject) => {
    try {
      // 验证参数
      if (!headers || !Array.isArray(headers)) {
        throw new Error('表头必须是数组')
      }
      if (!data || !Array.isArray(data)) {
        throw new Error('数据必须是数组')
      }
      if (!filename) {
        throw new Error('文件名不能为空')
      }

      // 组合表头和数据
      const worksheetData = [headers, ...data]

      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // 设置列宽（如果提供）
      if (columnWidths && columnWidths.length > 0) {
        worksheet['!cols'] = columnWidths
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // 生成文件名
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
      const fullFilename = `${filename}_${timestamp}.xlsx`

      // 导出文件
      XLSX.writeFile(workbook, fullFilename)

      resolve(fullFilename)
    } catch (error) {
      console.error('导出失败:', error)
      reject(error)
    }
  })
}
