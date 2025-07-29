'use client'
import { useState, useRef } from 'react'
import SimpleImage from './SimpleImage'

export default function ImageUpload({ value, onChange, placeholder = "请选择图片" }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('不支持的文件类型，只支持 JPEG、PNG、GIF、WebP 格式')
      return
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('文件大小不能超过 5MB')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        onChange(result.data.url)
      } else {
        setUploadError(result.message || '上传失败')
      }
    } catch (err) {
      setUploadError('网络错误，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const event = { target: { files: [file] } }
      handleFileSelect(event)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isUploading 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">上传中...</p>
          </div>
                 ) : value ? (
           <div className="space-y-2">
             <div className="relative w-full h-32 mx-auto">
               <SimpleImage
                 src={value}
                 alt="预览"
                 fill
                 className="object-cover rounded-md"
               />
             </div>
             <p className="text-sm text-gray-600">点击或拖拽更换图片</p>
           </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">支持 JPG、PNG、GIF、WebP 格式，最大 5MB</p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {value && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="图片URL"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="ml-2 px-3 py-2 text-sm text-red-600 hover:text-red-800"
          >
            清除
          </button>
        </div>
      )}
    </div>
  )
} 