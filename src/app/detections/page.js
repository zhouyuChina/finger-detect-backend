'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DetectionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchOpenid, setSearchOpenid] = useState('')
  const [searchUserName, setSearchUserName] = useState('')
  const [searchArchiveId, setSearchArchiveId] = useState('')
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
        openid: searchOpenid,
        userName: searchUserName,
        archiveId: searchArchiveId
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
  }, [currentPage, pageSize, searchOpenid, searchUserName, searchArchiveId])

  // 处理URL参数
  useEffect(() => {
    const searchOpenidParam = searchParams.get('searchOpenid')
    const userNameParam = searchParams.get('userName')
    const archiveIdParam = searchParams.get('archiveId')
    
    if (searchOpenidParam) {
      setSearchOpenid(searchOpenidParam)
      setCurrentPage(1)
    }
    
    if (userNameParam) {
      setSearchUserName(userNameParam)
      setCurrentPage(1)
    }
    
    if (archiveIdParam) {
      setSearchArchiveId(archiveIdParam)
      setCurrentPage(1)
    }
  }, [searchParams])
  
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
    setSearchOpenid('')
    setSearchUserName('')
    setSearchArchiveId('')
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

  const handleExportReport = async (detectionId) => {
    try {
      const response = await fetch('/api/detections/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify({
          detectionId: detectionId
        })
      })

      if (response.ok) {
        // 获取文件名
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = '检测报告.zip'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        // 下载文件
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('导出成功！')
      } else {
        const result = await response.json()
        if (response.status === 401) {
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          alert(result.message || '导出失败')
        }
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
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
          <h1 className="text-2xl font-bold text-gray-900">检测报告</h1>
          <p className="text-gray-600">管理用户检测报告信息（每个档案的首次检测报告）</p>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="space-y-4">
          {/* 第一行：搜索字段 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所属ID</label>
              <input
                type="text"
                value={searchOpenid}
                onChange={(e) => setSearchOpenid(e.target.value)}
                placeholder="请输入所属ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
              <input
                type="text"
                value={searchUserName}
                onChange={(e) => setSearchUserName(e.target.value)}
                placeholder="请输入用户名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">档案ID</label>
              <input
                type="text"
                value={searchArchiveId}
                onChange={(e) => setSearchArchiveId(e.target.value)}
                placeholder="请输入档案ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
          
          {/* 第二行：按钮区域 */}
          <div className="flex justify-end">
            <div className="flex space-x-2">
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
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总报告数</p>
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
                {new Set(allDetections.map(d => d.openid)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 检测记录列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">检测报告列表</h2>
            <div className="flex items-center space-x-4">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900"
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
                  序号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所属ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  档案名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  档案ID
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
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">加载中...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-red-600">{error}</td>
                </tr>
              ) : currentDetections.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">暂无检测报告</td>
                </tr>
              ) : (
              currentDetections.map((detection, index) => (
                <tr key={detection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{startIndex + index + 1}</div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{detection.openid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{detection.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{detection.archiveName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{detection.archiveId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(detection.detectionTime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => router.push(`/detections/${detection.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看报告
                      </button>
                      <button 
                        onClick={() => handleExportReport(detection.id)}
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
      </div>
    </div>
  )
} 