import JSZip from 'jszip'
import fetch from 'node-fetch'

/**
 * 通用ZIP导出工具函数
 * @param {Object} options
 * @param {Array} options.files - 文件数组，每个文件包含 { url, filename, content }
 * @param {string} options.zipName - ZIP文件名（不包含扩展名）
 * @param {string} options.folderName - 文件夹名称（可选）
 * @returns {Promise<Buffer>} ZIP文件的Buffer
 */
export const createZipFile = async (options) => {
  const { files, zipName, folderName } = options
  
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('文件列表不能为空')
  }
  
  if (!zipName) {
    throw new Error('ZIP文件名不能为空')
  }

  const zip = new JSZip()
  const currentDate = new Date().toISOString().split('T')[0]
  
  // 如果有文件夹名称，创建文件夹
  const targetFolder = folderName ? zip.folder(folderName) : zip

  // 处理文件
  const filePromises = files.map(async (file) => {
    try {
      let content
      
      if (file.content) {
        // 直接使用提供的内容
        content = file.content
      } else if (file.url) {
        // 从URL下载内容
        const response = await fetch(file.url)
        if (!response.ok) {
          console.warn(`无法下载文件: ${file.url}`)
          return null
        }
        content = await response.buffer()
      } else {
        console.warn('文件缺少内容或URL')
        return null
      }

      // 添加到ZIP
      targetFolder.file(file.filename, content)
      return file.filename
    } catch (error) {
      console.error(`处理文件失败: ${file.filename || file.url}`, error)
      return null
    }
  })

  // 等待所有文件处理完成
  const processedFiles = await Promise.all(filePromises)
  const successfulFiles = processedFiles.filter(file => file !== null)

  if (successfulFiles.length === 0) {
    throw new Error('没有可处理的文件')
  }

  // 生成ZIP文件
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  
  return {
    buffer: zipBuffer,
    filename: `${zipName}_${currentDate}.zip`,
    fileCount: successfulFiles.length
  }
}

/**
 * 创建检测报告ZIP文件
 * @param {Object} detection - 检测记录对象
 * @returns {Promise<Object>} ZIP文件信息
 */
export const createDetectionReportZip = async (detection) => {
  const zip = new JSZip()
  const currentDate = new Date().toISOString().split('T')[0]
  
  // 添加报告信息文件 - 使用ASCII字符
  const safeUserName = (detection.userName || 'unknown').replace(/[^\x00-\x7F]/g, 'unknown')
  const safeArchiveName = (detection.archiveName || 'unknown').replace(/[^\x00-\x7F]/g, 'unknown')
  
  const reportContent = `Detection Report\nID: ${detection.id}\nUser: ${safeUserName}\nArchive: ${safeArchiveName}\nResult: ${detection.result || 'unknown'}\nConfidence: ${detection.confidence ? (detection.confidence * 100).toFixed(2) + '%' : 'unknown'}`
  
  zip.file('report.txt', Buffer.from(reportContent, 'ascii'))
  
  // 生成ZIP文件
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  const zipName = `detection_report_${safeUserName}_${safeArchiveName}`
  
  return {
    buffer: zipBuffer,
    filename: `${zipName}_${currentDate}.zip`,
    fileCount: 1
  }
}


