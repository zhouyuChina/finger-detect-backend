'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import SimpleImage from '@/components/SimpleImage'
import SafeDate from '@/components/SafeDate'

export default function UserIdsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchWechatName, setSearchWechatName] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [searchRealName, setSearchRealName] = useState('')
  const [allUserIds, setAllUserIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 从数据库获取ID管理数据
  const fetchUserIds = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user-ids')
      const result = await response.json()
      
      if (response.ok) {
        setAllUserIds(result.data.data || [])
      } else {
        setError(result.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 使用useEffect获取数据
  useEffect(() => {
    fetchUserIds()
  }, [])
  
  // 过滤ID管理数据
  const filteredUserIds = allUserIds.filter(userId => {
    const matchWechatName = !searchWechatName || 
      (userId.user?.nickname && userId.user.nickname.toLowerCase().includes(searchWechatName.toLowerCase()))
    const matchStatus = !searchStatus || userId.verifyStatus === searchStatus
    const matchRealName = !searchRealName || 
      (userId.realName && userId.realName.toLowerCase().includes(searchRealName.toLowerCase()))
    return matchWechatName && matchStatus && matchRealName
  })
  
  const totalUserIds = filteredUserIds.length
  const totalPages = Math.ceil(totalUserIds / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentUserIds = filteredUserIds.slice(startIndex, endIndex)

  // 统计数据
  const pendingCount = filteredUserIds.filter(u => u.verifyStatus === 'pending').length
  const verifiedCount = filteredUserIds.filter(u => u.verifyStatus === 'verified').length
  const rejectedCount = filteredUserIds.filter(u => u.verifyStatus === 'rejected').length

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
    setSearchWechatName('')
    setSearchStatus('')
    setSearchRealName('')
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条ID记录吗？')) return
    
    try {
      const response = await fetch(`/api/user-ids/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('删除成功')
        fetchUserIds() // 重新获取数据
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

  const handleVerify = async (id, status, rejectReason = '') => {
    const action = status === 'verified' ? '通过' : '拒绝'
    if (!confirm(`确定要${action}这条ID记录吗？`)) return
    
    try {
      const response = await fetch(`/api/user-ids/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify({
          verifyStatus: status,
          rejectReason: status === 'rejected' ? rejectReason : undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`${action}成功`)
        fetchUserIds() // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          alert(result.message || `${action}失败`)
        }
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: '待审核',
      verified: '已通过',
      rejected: '已拒绝'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID管理</h1>
          <p className="text-gray-600">管理微信小程序用户身份认证信息</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            导出数据
          </button>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">微信名</label>
            <input
              type="text"
              value={searchWechatName}
              onChange={(e) => setSearchWechatName(e.target.value)}
              placeholder="请输入微信名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
            <input
              type="text"
              value={searchRealName}
              onChange={(e) => setSearchRealName(e.target.value)}
              placeholder="请输入真实姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">认证状态</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="verified">已通过</option>
              <option value="rejected">已拒绝</option>
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

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总记录数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUserIds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">待审核</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已通过</p>
              <p className="text-2xl font-semibold text-gray-900">{verifiedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">❌</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已拒绝</p>
              <p className="text-2xl font-semibold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ID管理列表 */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">加载中...</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">ID管理列表</h2>
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
                      微信名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      真实姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      身份证号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      认证状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      身份证照片
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提交时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      审核时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      审核人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUserIds.map((userId) => (
                    <tr key={userId.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {userId.user?.avatar && (
                            <SimpleImage
                              src={userId.user.avatar}
                              alt={userId.user.nickname || '用户头像'}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {userId.user?.nickname || '未知用户'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userId.realName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userId.idNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userId.verifyStatus)}`}>
                          {getStatusText(userId.verifyStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {userId.idCardFront && (
                            <SimpleImage
                              src={userId.idCardFront}
                              alt="身份证正面"
                              className="w-12 h-8 object-cover rounded"
                            />
                          )}
                          {userId.idCardBack && (
                            <SimpleImage
                              src={userId.idCardBack}
                              alt="身份证背面"
                              className="w-12 h-8 object-cover rounded"
                            />
                          )}
                          {!userId.idCardFront && !userId.idCardBack && (
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">无图</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <SafeDate date={userId.createdAt} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userId.verifyTime ? <SafeDate date={userId.verifyTime} /> : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userId.verifyAdmin?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => router.push(`/user-ids/view/${userId.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          查看
                        </button>
                        {userId.verifyStatus === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleVerify(userId.id, 'verified')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              通过
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('请输入拒绝原因：')
                                if (reason !== null) {
                                  handleVerify(userId.id, 'rejected', reason)
                                }
                              }}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(userId.id)}
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

            {/* 分页 */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  显示第 {startIndex + 1} 到 {Math.min(endIndex, totalUserIds)} 条，共 {totalUserIds} 条记录
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
          </>
        )}
      </div>
    </div>
  )
} 