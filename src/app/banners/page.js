'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import SimpleImage from '@/components/SimpleImage'
import SafeDate from '@/components/SafeDate'

export default function BannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [config, setConfig] = useState({
    banner_limit: '5',
    banner_interval: '3',
    banner_autoplay: true
  })
  const [isConfigLoading, setIsConfigLoading] = useState(false)

  // 获取Banner列表
  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      const result = await response.json()
      
      if (response.ok) {
        setBanners(result.data.data || [])
      } else {
        setError(result.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取Banner配置
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/banners/config')
      const result = await response.json()
      
      if (response.ok) {
        setConfig({
          banner_limit: result.data.banner_limit || '5',
          banner_interval: result.data.banner_interval || '3',
          banner_autoplay: result.data.banner_autoplay === 'true'
        })
      }
    } catch (err) {
      console.error('获取配置失败:', err)
    }
  }

  // 保存Banner配置
  const saveConfig = async () => {
    setIsConfigLoading(true)
    try {
      const token = getLocalStorage('token')
      const response = await fetch('/api/banners/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (response.ok) {
        alert('配置保存成功')
      } else {
        alert(result.message || '保存失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    } finally {
      setIsConfigLoading(false)
    }
  }

  // 删除Banner
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个Banner吗？')) return

    try {
      const token = getLocalStorage('token')
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        fetchBanners() // 重新获取数据
      } else {
        alert(result.message || '删除失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
  }

  // 切换Banner状态
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = getLocalStorage('token')
      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      const result = await response.json()

      if (response.ok) {
        fetchBanners() // 重新获取数据
      } else {
        alert(result.message || '更新失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchConfig()
  }, [])

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Banner管理</h1>
          <p className="text-gray-600">管理网站首页轮播图和广告图片</p>
        </div>
        <button 
          onClick={() => router.push('/banners/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          添加Banner
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Banner配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner配置</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner数量限制
            </label>
            <input
              type="number"
              value={config.banner_limit}
              onChange={(e) => setConfig(prev => ({ ...prev, banner_limit: e.target.value }))}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">最多显示10个Banner</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              滚动间隔时间（秒）
            </label>
            <input
              type="number"
              value={config.banner_interval}
              onChange={(e) => setConfig(prev => ({ ...prev, banner_interval: e.target.value }))}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">1-10秒之间</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自动播放
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.banner_autoplay}
                onChange={(e) => setConfig(prev => ({ ...prev, banner_autoplay: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">启用自动轮播</label>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={saveConfig}
            disabled={isConfigLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfigLoading ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
      
      {/* Banner列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Banner列表</h2>
        </div>
        
        {banners.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500 mb-4">暂无Banner数据</div>
            <button 
              onClick={() => router.push('/banners/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              添加第一个Banner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    链接地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-12 bg-gray-200 rounded-md overflow-hidden relative">
                        <SimpleImage
                          src={banner.imageUrl}
                          alt={banner.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {banner.linkUrl ? (
                          <a 
                            href={banner.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 truncate block max-w-xs"
                            title={banner.linkUrl}
                          >
                            {banner.linkUrl}
                          </a>
                        ) : (
                          <span className="text-gray-400">无链接</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                          banner.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {banner.isActive ? '已启用' : '已禁用'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {banner.sort}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <SafeDate date={banner.createdAt} format="date" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => router.push(`/banners/edit/${banner.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 