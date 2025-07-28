'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DetectionsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchUserId, setSearchUserId] = useState('')
  const [searchUserNickname, setSearchUserNickname] = useState('')
  const [searchArchiveName, setSearchArchiveName] = useState('')
  const [searchBodyPart, setSearchBodyPart] = useState('')
  const [allDetections, setAllDetections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 从数据库获取检测记录数据
  const fetchDetections = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        userId: searchUserId,
        userNickname: searchUserNickname,
        archiveName: searchArchiveName,
        bodyPart: searchBodyPart
      })
      
      const response = await fetch(`/api/detections?${params}`)
      const result = await response.json()
      
      if (response.ok) {
        setAllDetections(result.data.data || [])
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

  // 使用useEffect获取数据
  useEffect(() => {
    fetchDetections()
  }, [currentPage, pageSize, searchUserId, searchUserNickname, searchArchiveName, searchBodyPart])
  
  const totalDetections = allDetections.length
  const totalPages = Math.ceil(totalDetections / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentDetections = allDetections.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchUserId('')
    setSearchUserNickname('')
    setSearchArchiveName('')
    setSearchBodyPart('')
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条检测记录吗？')) return
    
    try {
      const response = await fetch(`/api/detections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('删除成功')
        fetchDetections() // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          alert(result.message || '删除失败')
        }
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
  }

  const getBodyPartText = (bodyPart) => {
    const bodyPartMap = {
      finger: '指纹',
      palm: '掌纹',
      face: '人脸',
      iris: '虹膜',
      voice: '声纹'
    }
    return bodyPartMap[bodyPart] || bodyPart
  }

  const getBodyPartColor = (bodyPart) => {
    const colorMap = {
      finger: 'bg-blue-100 text-blue-800',
      palm: 'bg-purple-100 text-purple-800',
      face: 'bg-pink-100 text-pink-800',
      iris: 'bg-indigo-100 text-indigo-800',
      voice: 'bg-teal-100 text-teal-800'
    }
    return colorMap[bodyPart] || 'bg-gray-100 text-gray-800'
  }

  // 获取localStorage的辅助函数
  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">检测记录</h1>
          <p className="text-gray-600">管理用户检测记录信息</p>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属ID</label>
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="请输入所属ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户昵称</label>
            <input
              type="text"
              value={searchUserNickname}
              onChange={(e) => setSearchUserNickname(e.target.value)}
              placeholder="请输入用户昵称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
            <input
              type="text"
              value={searchArchiveName}
              onChange={(e) => setSearchArchiveName(e.target.value)}
              placeholder="请输入档案名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
            <select
              value={searchBodyPart}
              onChange={(e) => setSearchBodyPart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部部位</option>
              <option value="finger">指纹</option>
              <option value="palm">掌纹</option>
              <option value="face">人脸</option>
              <option value="iris">虹膜</option>
              <option value="voice">声纹</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              搜索
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">🔍</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总检测数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalDetections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">活跃用户</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(allDetections.map(d => d.userId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 检测记录列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">检测记录列表</h2>
            <div className="flex items-center space-x-4">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所属ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户昵称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  档案名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  检测部位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  检测时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">加载中...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-red-600">{error}</td>
                </tr>
              ) : currentDetections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">暂无检测记录</td>
                </tr>
              ) : (
                currentDetections.map((detection) => (
                  <tr key={detection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{detection.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{detection.userNickname}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{detection.archiveName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBodyPartColor(detection.bodyPart)}`}>
                        {getBodyPartText(detection.bodyPart)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(detection.detectionTime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => console.log('查看报告功能待实现')}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看报告
                      </button>
                      <button 
                        onClick={() => console.log('导出报告功能待实现')}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        导出报告
                      </button>
                      <button 
                        onClick={() => handleDelete(detection.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示第 {startIndex + 1} 到 {Math.min(endIndex, totalDetections)} 条，共 {totalDetections} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 