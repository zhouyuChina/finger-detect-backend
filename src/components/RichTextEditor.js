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

  // 自定义上传处理器
  const handleImageUpload = async (files) => {
    const file = files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        return {
          success: 1,
          data: {
            url: result.data.url
          }
        }
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      console.error('图片上传错误:', error)
      throw error
    }
  }

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
      process: handleImageUpload,
      defaultHandlerSuccess: function (data) {
        if (data && data.data && data.data.url) {
          this.selection.insertImage(data.data.url)
        }
      },
      defaultHandlerError: function (error) {
        console.error('上传失败:', error)
        this.events.fire('errorMessage', error.message || '图片上传失败')
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

    // 内容样式
    iframeCSSLinks: [],
    iframeStyle: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #333 !important;
        margin: 10px !important;
        padding: 0 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 16px 0 8px 0 !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
      }
      h1 { font-size: 24px !important; }
      h2 { font-size: 20px !important; }
      h3 { font-size: 18px !important; }
      h4 { font-size: 16px !important; }
      h5 { font-size: 14px !important; }
      h6 { font-size: 12px !important; }
      p { margin: 0 0 10px 0 !important; }
      ul, ol { margin: 0 0 10px 20px !important; }
      li { margin: 0 0 5px 0 !important; }
      blockquote {
        margin: 10px 0 !important;
        padding: 10px 20px !important;
        border-left: 4px solid #ddd !important;
        background-color: #f9f9f9 !important;
        font-style: italic !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
        margin: 10px 0 !important;
        border-radius: 4px !important;
      }
      a {
        color: #007bff !important;
        text-decoration: none !important;
      }
      a:hover {
        text-decoration: underline !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 10px 0 !important;
      }
      table td, table th {
        border: 1px solid #ddd !important;
        padding: 8px !important;
      }
      table th {
        background-color: #f2f2f2 !important;
        font-weight: bold !important;
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