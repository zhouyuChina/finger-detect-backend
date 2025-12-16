'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SafeImage from '../../../components/SafeImage'

function ArchiveImagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [archiveInfo, setArchiveInfo] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalImages, setTotalImages] = useState(0)

  const archiveName = searchParams.get('archiveName')
  const userId = searchParams.get('userId')
  const archiveId = searchParams.get('archiveId')

  // 获取档案图片数据
  const fetchImages = async () => {
    // 至少需要档案名称或档案ID之一
    if (!archiveName && !archiveId) {
      setError('缺少档案名称或档案ID参数')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        pageSize
      })
      
      // 优先使用档案ID，更精确
      if (archiveId) {
        params.append('archiveId', archiveId)
      } else if (archiveName) {
        params.append('archiveName', archiveName)
      }
      
      const token = getLocalStorage('token')
      const response = await fetch(`/api/detections?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()
      
      if (response.ok) {
        setImages(result.data.data || [])
        setTotalImages(result.data.pagination.total)
        
        // 获取档案信息
        if (result.data.data.length > 0) {
          const firstImage = result.data.data[0]
          setArchiveInfo({
            archiveName: firstImage.archiveName,
            userId: firstImage.openid,
            userNickname: firstImage.userName,
            bodyPart: firstImage.detectionType
          })
        }
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
    fetchImages()
  }, [currentPage, pageSize, archiveName, archiveId])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleExportImages = async () => {
    if (!archiveName && !archiveId) {
      alert('缺少档案参数')
      return
    }

    console.log('📤 导出图片请求参数:', {
      archiveName: archiveName,
      archiveId: archiveId,
      userId: userId
    })

    try {
      const response = await fetch('/api/archives/export-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify({
          archiveName: archiveName,
          archiveId: archiveId,
          userId: userId
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${archiveInfo?.userNickname || userId || 'unknown'}_${archiveName}_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result = await response.json()
        alert(result.message || '导出失败')
      }
    } catch (err) {
      alert('导出失败，请重试')
    }
  }

  const getBodyPartText = (bodyPart) => {
    const bodyPartMap = {
      'left_hand_thumb': '左手拇指',
      'left_hand_index': '左手食指',
      'left_hand_middle': '左手中指',
      'left_hand_ring': '左手无名指',
      'left_hand_little': '左手小指',
      'right_hand_thumb': '右手拇指',
      'right_hand_index': '右手食指',
      'right_hand_middle': '右手中指',
      'right_hand_ring': '右手无名指',
      'right_hand_little': '右手小指',
      'left_palm': '左手掌',
      'right_palm': '右手掌',
      'left_foot_big': '左脚大脚趾',
      'left_foot_index': '左脚二脚趾',
      'left_foot_middle': '左脚中脚趾',
      'left_foot_ring': '左脚四脚趾',
      'left_foot_little': '左脚小脚趾',
      'right_foot_big': '右脚大脚趾',
      'right_foot_index': '右脚二脚趾',
      'right_foot_middle': '右脚中脚趾',
      'right_foot_ring': '右脚四脚趾',
      'right_foot_little': '右脚小脚趾'
    }
    return bodyPartMap[bodyPart] || bodyPart
  }

  const getBodyPartColor = (bodyPart) => {
    // 添加空值检查
    if (!bodyPart) {
      return 'bg-gray-100 text-gray-800'
    }
    
    if (bodyPart.startsWith('left_hand') || bodyPart.startsWith('right_hand') || bodyPart.includes('palm')) {
      return 'bg-blue-100 text-blue-800'
    } else if (bodyPart.startsWith('left_foot') || bodyPart.startsWith('right_foot') || bodyPart.includes('sole')) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  }

  const totalPages = Math.ceil(totalImages / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">档案图片查看</h1>
          <p className="text-gray-600">查看档案下的所有检测图片</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            返回
          </button>
          <button
            onClick={handleExportImages}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            导出图片
          </button>
        </div>
      </div>

      {/* 档案信息卡片 */}
      {archiveInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">档案信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
              <div className="text-sm text-gray-900">{archiveInfo.archiveName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户ID</label>
              <div className="text-sm text-gray-900">{archiveInfo.userId}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
              <div className="text-sm text-gray-900">{archiveInfo.userNickname}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBodyPartColor(archiveInfo.bodyPart || '')}`}>
                  {getBodyPartText(archiveInfo.bodyPart || '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">图片列表</h3>
            <p className="text-sm text-gray-600">共 {totalImages} 张图片</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900"
            >
              <option value={12}>12张/页</option>
              <option value={20}>20张/页</option>
              <option value={50}>50张/页</option>
            </select>
          </div>
        </div>
      </div>

      {/* 图片网格 */}
      {images.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <SafeImage
                      src={image.imageUrl}
                      alt={`检测图片 ${startIndex + index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>序号: {startIndex + index + 1}</div>
                    <div>时间: {image.detectionTime ? new Date(image.detectionTime).toLocaleString('zh-CN') : '未知'}</div>
                    {image.result && (
                      <div className="mt-1">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                          image.result === 'normal' ? 'bg-green-100 text-green-800' : 
                          image.result === 'onychomycosis' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {image.result === 'normal' ? '正常' : 
                           image.result === 'onychomycosis' ? '灰指甲' :
                           image.result === 'photo_only' ? '仅拍照' :
                           image.result}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  显示第 {startIndex + 1} 到 {Math.min(endIndex, totalImages)} 张，共 {totalImages} 张图片
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-900"
                  >
                    上一页
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  {totalPages > 5 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-900"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p className="text-gray-600">该档案下还没有检测图片</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ArchiveImagesPage() {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <ArchiveImagesPageContent />
    </Suspense>
  )
}
