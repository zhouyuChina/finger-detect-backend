'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import RichTextEditor from '@/components/RichTextEditor'
import NewsPreview from '@/components/NewsPreview'
import { getLocalStorage } from '@/hooks/useLocalStorage'

export default function AddNewsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    coverImage: '',
    author: '',
    category: 'default',
    isTop: false
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('请输入标题')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify({
          ...formData,
          status: 'draft', // 默认状态为草稿
          tags: [] // 空标签数组
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('资讯创建成功')
        router.push('/news')
      } else {
        if (response.status === 401) {
          // 认证失败，跳转到首页
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          setError(result.message || '创建失败')
        }
      }
    } catch (err) {
      console.error('提交错误:', err)
      setError('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新增资讯</h1>
          <p className="text-gray-600 mt-1">创建新的资讯内容，支持富文本编辑</p>
        </div>
        <button
          onClick={() => router.push('/news')}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          返回列表
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="请输入资讯标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作者
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="请输入作者"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="default">默认分类</option>
              </select>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">内容</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                摘要
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="请输入资讯摘要"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => handleInputChange('content', html)}
                placeholder="请输入资讯内容，支持富文本编辑..."
              />
              <p className="text-xs text-gray-500 mt-1">支持富文本编辑，可以插入图片、链接、格式化文本等</p>
            </div>
          </div>
        </div>

        {/* 图片 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">封面图片</h3>
          <ImageUpload
            value={formData.coverImage}
            onChange={(url) => handleInputChange('coverImage', url)}
            placeholder="点击或拖拽上传封面图片"
          />
          <p className="text-xs text-gray-500 mt-1">建议尺寸 800x400，支持 JPG、PNG、GIF、WebP 格式</p>
        </div>

        {/* 设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">设置</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型标记
            </label>
            <div className="space-y-2 text-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isTop}
                  onChange={(e) => handleInputChange('isTop', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">置顶</span>
              </label>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/news')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            预览
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '保存中...' : '保存资讯'}
          </button>
        </div>
      </form>

      {/* 预览弹窗 */}
      <NewsPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        newsData={formData}
      />
    </div>
  )
} 