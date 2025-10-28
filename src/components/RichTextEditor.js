'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'

// 动态导入 JoditEditor 以避免 SSR 问题
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
        <div className="flex flex-wrap gap-1">
          <div className="px-2 py-1 text-sm rounded bg-gray-200 text-gray-400">加载编辑器中...</div>
        </div>
      </div>
      <div className="p-4 min-h-[300px] bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  )
})

export default function RichTextEditor({ value, onChange, placeholder = "请输入内容..." }) {
  const editor = useRef(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Jodit 配置 - 类似微信公众号编辑器
  const config = useMemo(() => ({
    readonly: false,
    placeholder: placeholder,
    height: 400,
    minHeight: 300,
    
    // 工具栏配置
    toolbarAdaptive: true,
    toolbarStickyOffset: 0,
    
    // 按钮配置
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', '|', 
      'paragraph', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'fontcolor', 'brush', '|',
      'left', 'center', 'right', 'justify', '|',
      'undo', 'redo', '|',
      'link', 'unlink', '|',
      'image', '|',
      'table', '|',
      'hr', '|',
      'fullsize', '|',
      'preview', 'print', '|',
      'source'
    ],

    // 移除不需要的按钮
    removeButtons: ['video', 'file', 'about'],

    // 中文语言
    language: 'zh_cn',
    
    // 字体配置
    font: {
      'Arial': 'Arial',
      '宋体': '宋体, SimSun',
      '微软雅黑': '微软雅黑, "Microsoft YaHei"',
      '黑体': '黑体, SimHei',
      '楷体': '楷体, KaiTi',
      'Times New Roman': 'Times New Roman',
      'Courier New': 'Courier New',
      'Helvetica': 'Helvetica'
    },

    // 字体大小
    fontSize: {
      '12px': '12px',
      '14px': '14px',
      '16px': '16px',
      '18px': '18px',
      '20px': '20px',
      '24px': '24px',
      '28px': '28px',
      '32px': '32px',
      '36px': '36px'
    },

    // 图片上传配置
    uploader: {
      insertImageAsBase64URI: false,
      imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      url: '/api/upload',
      filesVariableName: () => 'file',
      withCredentials: false,
      method: 'POST',
      format: 'json',
      prepareData: function (formData) {
        return formData
      },
      isSuccess: function (resp) {
        return resp && resp.success
      },
      getMessage: function (resp) {
        return resp.message || ''
      },
      process: function (resp) {
        const url = resp?.data?.url
        return {
          files: url ? [url] : [],
          path: '',
          baseurl: '',
          error: resp.success ? 0 : 1,
          msg: resp.message || ''
        }
      },
      defaultHandlerSuccess: function (data) {
        const files = data.files || []
        if (files.length > 0) {
          const url = files[0]
          this.selection.insertImage(url, null, 300)
        }
      },
      defaultHandlerError: function (error) {
        console.error('上传失败:', error)
        this.events.fire('errorMessage', error.msg || '图片上传失败')
      }
    },

    // 链接配置
    link: {
      followOnDblClick: false,
      openInNewTabCheckbox: true,
      noFollowCheckbox: false
    },

    // 表格配置  
    table: {
      selectionCellStyle: 'border: 1px double #1e88e5 !important;'
    },

    // 样式配置
    style: {
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6'
    },

    // 内容样式 - 移动端优化
    iframeCSSLinks: [],
    iframeStyle: `
      /* 基础样式 - 移动端优先 */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-size: 16px !important; /* 移动端推荐 16px，避免缩放 */
        line-height: 1.8 !important; /* 更大的行高，提升可读性 */
        color: #333 !important;
        margin: 0 !important;
        padding: 15px !important; /* 移动端增加内边距 */
        word-wrap: break-word !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        -webkit-text-size-adjust: 100% !important; /* 防止iOS自动调整字体大小 */
      }

      /* 标题样式 - 移动端优化 */
      h1, h2, h3, h4, h5, h6 {
        margin: 20px 0 12px 0 !important;
        font-weight: 600 !important;
        line-height: 1.4 !important;
        color: #1a1a1a !important;
        word-wrap: break-word !important;
      }
      h1 {
        font-size: 26px !important; /* 移动端适中大小 */
        margin-top: 0 !important;
      }
      h2 { font-size: 22px !important; }
      h3 { font-size: 20px !important; }
      h4 { font-size: 18px !important; }
      h5 { font-size: 16px !important; }
      h6 { font-size: 14px !important; }

      /* 段落样式 */
      p {
        margin: 0 0 15px 0 !important;
        font-size: 16px !important;
        line-height: 1.8 !important;
      }

      /* 列表样式 - 移动端优化 */
      ul, ol {
        margin: 0 0 15px 0 !important;
        padding-left: 25px !important; /* 减少缩进 */
      }
      li {
        margin: 0 0 8px 0 !important;
        line-height: 1.8 !important;
      }

      /* 引用样式 - 移动端优化 */
      blockquote {
        margin: 15px 0 !important;
        padding: 12px 15px !important;
        border-left: 4px solid #1890ff !important;
        background-color: #f6f8fa !important;
        font-style: normal !important; /* 移除斜体 */
        border-radius: 4px !important;
        color: #555 !important;
      }

      /* 图片样式 - 移动端优化 */
      img {
        max-width: 100% !important;
        width: auto !important;
        height: auto !important;
        display: block !important; /* 块级显示 */
        margin: 15px auto !important; /* 居中显示 */
        border-radius: 8px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; /* 添加阴影 */
      }

      /* 链接样式 */
      a {
        color: #1890ff !important;
        text-decoration: none !important;
        word-wrap: break-word !important;
        -webkit-tap-highlight-color: rgba(24, 144, 255, 0.1) !important; /* 移动端点击高亮 */
      }
      a:hover, a:active {
        text-decoration: underline !important;
      }

      /* 表格样式 - 移动端优化 */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 15px 0 !important;
        font-size: 14px !important; /* 表格字体稍小 */
        display: block !important; /* 允许横向滚动 */
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important; /* iOS 平滑滚动 */
      }
      table td, table th {
        border: 1px solid #e8e8e8 !important;
        padding: 10px 8px !important;
        text-align: left !important;
        word-wrap: break-word !important;
        min-width: 80px !important; /* 最小宽度 */
      }
      table th {
        background-color: #fafafa !important;
        font-weight: 600 !important;
        color: #1a1a1a !important;
      }

      /* 水平线 */
      hr {
        border: none !important;
        border-top: 1px solid #e8e8e8 !important;
        margin: 20px 0 !important;
      }

      /* 代码样式 */
      code {
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace !important;
        background-color: #f5f5f5 !important;
        padding: 2px 6px !important;
        border-radius: 3px !important;
        font-size: 14px !important;
        color: #d63200 !important;
      }

      pre {
        background-color: #f5f5f5 !important;
        padding: 12px !important;
        border-radius: 4px !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        margin: 15px 0 !important;
      }

      pre code {
        background-color: transparent !important;
        padding: 0 !important;
        color: #333 !important;
      }

      /* 强调文本 */
      strong, b {
        font-weight: 600 !important;
        color: #1a1a1a !important;
      }

      /* 视频/iframe 响应式 */
      video, iframe {
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 15px auto !important;
      }
    `,

    // 粘贴配置
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    
    // 禁用一些功能
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    
    // 其他配置
    beautifyHTML: true,
    useAceEditor: false,
    colorPickerDefaultTab: 'color',
    imageDefaultWidth: 300,
    
    // 事件配置
    events: {
      beforeCommand: function() {
        // 可以在这里拦截命令
      }
    }
  }), [placeholder])

  // 处理编辑器内容变化
  const handleEditorChange = (newContent) => {
    onChange(newContent)
  }

  // 服务端渲染时显示占位符
  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
          <div className="flex flex-wrap gap-1">
            <div className="px-2 py-1 text-sm rounded bg-gray-200 text-gray-400">初始化编辑器...</div>
          </div>
        </div>
        <div className="p-4 min-h-[300px] bg-gray-50">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={handleEditorChange}
        onChange={() => {}}
      />
    </div>
  )
}