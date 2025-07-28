'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import ImageUpload from '@/components/ImageUpload'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import SafeImage from '@/components/SafeImage'

export default function EditBannerPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    sort: 0,
    isActive: true,
    startTime: '',
    endTime: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  // 获取Banner详情
  const fetchBanner = async () => {
    try {
      const response = await fetch(`/api/banners/${id}`)
      const result = await response.json()
      
      if (response.ok) {
        const banner = result.data
        setFormData({
          title: banner.title || '',
          imageUrl: banner.imageUrl || '',
          linkUrl: banner.linkUrl || '',
          sort: banner.sort || 0,
          isActive: banner.isActive,
          startTime: banner.startTime ? new Date(banner.startTime).toISOString().slice(0, 16) : '',
          endTime: banner.endTime ? new Date(banner.endTime).toISOString().slice(0, 16) : ''
        })
      } else {
        setError(result.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const token = getLocalStorage('token')
      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        router.push('/banners')
      } else {
        setError(result.message || '更新失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchBanner()
    }
  }, [id])

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑Banner</h1>
          <p className="text-gray-600">修改轮播图信息</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          返回
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入Banner标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序
              </label>
              <input
                type="number"
                name="sort"
                value={formData.sort}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片 <span className="text-red-500">*</span>
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              placeholder="点击或拖拽上传Banner图片"
            />
            <p className="text-xs text-gray-500 mt-1">建议尺寸 800x400，支持 JPG、PNG、GIF、WebP 格式</p>
          </div>

          {/* 链接URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              链接URL
            </label>
            <input
              type="url"
              name="linkUrl"
              value={formData.linkUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">点击Banner时跳转的链接（可选）</p>
          </div>

          {/* 时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始时间
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束时间
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 状态设置 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">启用Banner</span>
            </label>
          </div>

          {/* 预览 */}
          {formData.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预览效果
              </label>
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div className="max-w-md mx-auto">
                  <div className="relative w-full h-32">
                    <SafeImage
                      src={formData.imageUrl}
                      alt={formData.title}
                      fill
                      className="object-cover rounded-md shadow-sm"
                    />
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>标题:</strong> {formData.title || '未设置'}</p>
                    <p><strong>链接:</strong> {formData.linkUrl || '无'}</p>
                    <p><strong>状态:</strong> {formData.isActive ? '启用' : '禁用'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '更新中...' : '更新Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 