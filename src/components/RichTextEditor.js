'use client'
import { useState, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'

export default function RichTextEditor({ value, onChange, placeholder = "请输入内容..." }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 自定义上传处理器
  const handleImageUpload = (blobInfo, progress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', blobInfo.blob(), blobInfo.filename())
      
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          resolve(result.data.url)
        } else {
          reject(result.message || '上传失败')
        }
      })
      .catch(error => {
        reject('网络错误，请重试')
      })
    })
  }

  // TinyMCE 配置 - 类似微信公众号编辑器
  const editorConfig = {
    height: 400,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
      'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | image media | link | help',
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 10px;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 16px 0 8px 0;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }
      h4 { font-size: 16px; }
      h5 { font-size: 14px; }
      h6 { font-size: 12px; }
      p { margin: 0 0 10px 0; }
      ul, ol { margin: 0 0 10px 20px; }
      li { margin: 0 0 5px 0; }
      blockquote {
        margin: 10px 0;
        padding: 10px 20px;
        border-left: 4px solid #ddd;
        background-color: #f9f9f9;
        font-style: italic;
      }
      img {
        max-width: 100%;
        height: auto;
        margin: 10px 0;
        border-radius: 4px;
      }
      a {
        color: #007bff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
    language: 'zh_CN',
    placeholder: placeholder,
    branding: false,
    elementpath: false,
    resize: false,
    statusbar: false,
    // 图片上传配置
    images_upload_handler: handleImageUpload,
    images_upload_credentials: false,
    // 文件类型限制
    file_picker_types: 'image',
    images_file_types: 'jpeg,jpg,png,gif,webp',
    // 自动保存
    auto_save: true,
    auto_save_interval: '30s',
    // 粘贴配置
    paste_data_images: true,
    paste_as_text: false,
    // 链接配置
    link_default_target: '_blank',
    link_default_rel: 'noopener',
    // 媒体配置
    media_live_embeds: true,
    // 帮助配置
    help_tabs: ['shortcuts', 'plugins', 'about'],
    // 快捷键配置
    custom_shortcuts: {
      'meta+shift+s': {
        cmd: 'mceSave',
        desc: '保存'
      }
    },
    // 格式选择配置
    block_formats: '段落=p; 标题 1=h1; 标题 2=h2; 标题 3=h3; 标题 4=h4; 标题 5=h5; 标题 6=h6',
    // 字体大小配置
    font_size_formats: '12px 14px 16px 18px 20px 24px 28px 32px 36px 48px',
    // 颜色配置
    color_map: [
      '000000', '黑色',
      '434343', '深灰',
      '666666', '灰色',
      '999999', '浅灰',
      'b7b7b7', '银灰',
      'cccccc', '淡灰',
      'd9d9d9', '极淡灰',
      'efefef', '近白',
      'f3f3f3', '淡白',
      'ffffff', '白色',
      '980000', '深红',
      'ff0000', '红色',
      'ff9900', '橙色',
      'ffff00', '黄色',
      '00ff00', '绿色',
      '00ffff', '青色',
      '4a86e8', '蓝色',
      '0000ff', '深蓝',
      '9900ff', '紫色',
      'ff00ff', '洋红'
    ],
    // 背景色配置
    textcolor_map: [
      '000000', '黑色',
      '434343', '深灰',
      '666666', '灰色',
      '999999', '浅灰',
      'b7b7b7', '银灰',
      'cccccc', '淡灰',
      'd9d9d9', '极淡灰',
      'efefef', '近白',
      'f3f3f3', '淡白',
      'ffffff', '白色',
      'e6b8af', '浅红',
      'f4cccc', '淡红',
      'fce5cd', '浅橙',
      'fff2cc', '浅黄',
      'd9ead3', '浅绿',
      'd0e0e3', '浅青',
      'c9daf8', '浅蓝',
      'cfe2f3', '淡蓝',
      'd9d2e9', '浅紫',
      'ead1dc', '浅粉'
    ]
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
      <Editor
        apiKey="" // 免费版本不需要API key
        init={editorConfig}
        value={value}
        onEditorChange={(content, editor) => {
          onChange(content)
        }}
        onInit={(evt, editor) => {
          console.log('TinyMCE 编辑器已初始化')
        }}
        onBlur={(evt, editor) => {
          // 编辑器失去焦点时的处理
        }}
        onFocus={(evt, editor) => {
          // 编辑器获得焦点时的处理
        }}
      />
    </div>
  )
} 