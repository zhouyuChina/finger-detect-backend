'use client'
import { useState, useEffect } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document'

export default function RichTextEditor({ value, onChange, placeholder = "请输入内容..." }) {
  const [isClient, setIsClient] = useState(false)
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 自定义上传适配器
  const createUploadAdapter = (loader) => {
    return {
      upload: async () => {
        const file = await loader.file
        
        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          throw new Error('不支持的文件类型，只支持 JPEG、PNG、GIF、WebP 格式')
        }
        
        // 验证文件大小 (5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          throw new Error('文件大小不能超过 5MB')
        }
        
        try {
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (response.ok) {
            return {
              default: result.data.url
            }
          } else {
            throw new Error(result.message || '上传失败')
          }
        } catch (err) {
          throw new Error('网络错误，请重试')
        }
      }
    }
  }

  // 编辑器配置
  const editorConfig = {
    placeholder: placeholder,
    language: 'zh-cn',
    // 添加开源许可证配置
    licenseKey: 'GPL-2.0-or-later',
    // 禁用商业功能警告
    removePlugins: ['CKFinderUploadAdapter', 'CKFinder', 'EasyImage', 'CloudServices'],
    toolbar: {
      items: [
        'undo', 'redo',
        '|', 'heading',
        '|', 'bold', 'italic', 'underline', 'strikethrough',
        '|', 'fontSize', 'fontColor', 'fontBackgroundColor',
        '|', 'alignment',
        '|', 'numberedList', 'bulletedList',
        '|', 'indent', 'outdent',
        '|', 'link', 'blockQuote', 'imageUpload', 'mediaEmbed',
        '|', 'horizontalLine',
        '|', 'removeFormat'
      ]
    },
    heading: {
      options: [
        { model: 'paragraph', title: '段落', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: '标题 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: '标题 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: '标题 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: '标题 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: '标题 5', class: 'ck-heading_heading5' },
        { model: 'heading6', view: 'h6', title: '标题 6', class: 'ck-heading_heading6' }
      ]
    },
    fontSize: {
      options: [
        8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72
      ]
    },
    fontColor: {
      colors: [
        { color: '#000000', label: '黑色' },
        { color: '#434343', label: '深灰' },
        { color: '#666666', label: '灰色' },
        { color: '#999999', label: '浅灰' },
        { color: '#b7b7b7', label: '银灰' },
        { color: '#cccccc', label: '淡灰' },
        { color: '#d9d9d9', label: '极淡灰' },
        { color: '#efefef', label: '近白' },
        { color: '#f3f3f3', label: '淡白' },
        { color: '#ffffff', label: '白色' },
        { color: '#980000', label: '深红' },
        { color: '#ff0000', label: '红色' },
        { color: '#ff9900', label: '橙色' },
        { color: '#ffff00', label: '黄色' },
        { color: '#00ff00', label: '绿色' },
        { color: '#00ffff', label: '青色' },
        { color: '#4a86e8', label: '蓝色' },
        { color: '#0000ff', label: '深蓝' },
        { color: '#9900ff', label: '紫色' },
        { color: '#ff00ff', label: '洋红' }
      ]
    },
    fontBackgroundColor: {
      colors: [
        { color: '#000000', label: '黑色' },
        { color: '#434343', label: '深灰' },
        { color: '#666666', label: '灰色' },
        { color: '#999999', label: '浅灰' },
        { color: '#b7b7b7', label: '银灰' },
        { color: '#cccccc', label: '淡灰' },
        { color: '#d9d9d9', label: '极淡灰' },
        { color: '#efefef', label: '近白' },
        { color: '#f3f3f3', label: '淡白' },
        { color: '#ffffff', label: '白色' },
        { color: '#e6b8af', label: '浅红' },
        { color: '#f4cccc', label: '淡红' },
        { color: '#fce5cd', label: '浅橙' },
        { color: '#fff2cc', label: '浅黄' },
        { color: '#d9ead3', label: '浅绿' },
        { color: '#d0e0e3', label: '浅青' },
        { color: '#c9daf8', label: '浅蓝' },
        { color: '#cfe2f3', label: '淡蓝' },
        { color: '#d9d2e9', label: '浅紫' },
        { color: '#ead1dc', label: '浅粉' }
      ]
    },
    image: {
      upload: {
        types: ['jpeg', 'png', 'gif', 'webp']
      },
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative',
        '|',
        'linkImage'
      ],
      styles: [
        'full',
        'side',
        'alignLeft',
        'alignCenter',
        'alignRight'
      ]
    },
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://'
    },
    mediaEmbed: {
      previewsInData: true
    }
  }

  // 服务端渲染时显示占位符
  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
          <div className="flex flex-wrap gap-1">
            <div className="px-2 py-1 text-sm rounded bg-gray-200 text-gray-400">加载中...</div>
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
      <CKEditor
        editor={DecoupledEditor}
        config={editorConfig}
        data={value}
        onReady={(editor) => {
          // 添加自定义上传适配器
          editor.plugins.get('FileRepository').createUploadAdapter = createUploadAdapter
          
          // 设置编辑器高度
          editor.ui.view.element.style.minHeight = '300px'
          
          // 保存编辑器实例
          setEditor(editor)
          
          // 将工具栏插入到DOM中
          const toolbarElement = editor.ui.view.toolbar.element
          const editorElement = editor.ui.view.element.parentElement
          editorElement.insertBefore(toolbarElement, editorElement.firstChild)
          
          // 隐藏许可证警告
          const consoleWarn = console.warn
          console.warn = function(...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('license-key-missing')) {
              return
            }
            consoleWarn.apply(console, args)
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData()
          onChange(data)
        }}
        onBlur={(event, editor) => {
          // 编辑器失去焦点时的处理
        }}
        onFocus={(event, editor) => {
          // 编辑器获得焦点时的处理
        }}
      />
    </div>
  )
} 