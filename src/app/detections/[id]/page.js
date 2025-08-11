'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getLocalStorage } from '@/hooks/useLocalStorage'

export default function DetectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [detection, setDetection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 获取检测报告详情
  const fetchDetectionDetail = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/detections/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setDetection(result.data)
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          setError(result.message || '获取数据失败')
        }
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchDetectionDetail()
    }
  }, [params.id])

  // 获取localStorage的辅助函数
  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  }

  // 获取检测结果文本
  const getResultText = (result) => {
    const resultMap = {
      normal: '正常',
      abnormal: '异常',
      pending: '待检测'
    }
    return resultMap[result] || result
  }

  // 获取检测结果颜色
  const getResultColor = (result) => {
    const colorMap = {
      normal: 'bg-green-100 text-green-800',
      abnormal: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return colorMap[result] || 'bg-gray-100 text-gray-800'
  }

  // 获取检测状态文本
  const getStatusText = (status) => {
    const statusMap = {
      completed: '已完成',
      pending: '待处理',
      failed: '失败'
    }
    return statusMap[status] || status
  }

  // 获取检测状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!detection) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">未找到检测报告</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">检测报告详情</h1>
          <p className="text-gray-600">查看检测报告的详细信息</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            返回
          </button>
        </div>
      </div>

      {/* 检测报告信息 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">检测ID</label>
                <p className="mt-1 text-sm text-gray-900">{detection.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">用户名称</label>
                <p className="mt-1 text-sm text-gray-900">{detection.userName || '未知'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">所属ID</label>
                <p className="mt-1 text-sm text-gray-900">{detection.openid || '未知'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">档案名称</label>
                <p className="mt-1 text-sm text-gray-900">{detection.archiveName || '未知'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">档案ID</label>
                <p className="mt-1 text-sm text-gray-900">{detection.archiveId || '未知'}</p>
              </div>
            </div>
            
            {/* 右侧信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">检测结果</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(detection.result)}`}>
                    {getResultText(detection.result)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">置信度</label>
                <p className="mt-1 text-sm text-gray-900">
                  {detection.confidence ? `${(detection.confidence * 100).toFixed(2)}%` : '未知'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">检测状态</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(detection.status)}`}>
                    {getStatusText(detection.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">检测时间</label>
                <p className="mt-1 text-sm text-gray-900">
                  {detection.detectionTime ? new Date(detection.detectionTime).toLocaleString('zh-CN') : '未知'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">创建时间</label>
                <p className="mt-1 text-sm text-gray-900">
                  {detection.createdAt ? new Date(detection.createdAt).toLocaleString('zh-CN') : '未知'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 检测图片 */}
      {detection.imageUrl && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">检测图片</h2>
          </div>
          
          <div className="p-6">
            <div className="flex justify-center">
              <img
                src={detection.imageUrl}
                alt="检测图片"
                className="max-w-full h-auto max-h-96 rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="hidden text-center text-gray-500">
                <p>图片加载失败</p>
                <p className="text-sm">URL: {detection.imageUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 备注信息 */}
      {detection.remark && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">备注信息</h2>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{detection.remark}</p>
          </div>
        </div>
      )}
    </div>
  )
}
