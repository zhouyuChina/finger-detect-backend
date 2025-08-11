'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import SimpleImage from '@/components/SimpleImage'
import SafeDate from '@/components/SafeDate'
import ExcelExporter from '@/components/ExcelExporter'

export default function UserIdsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchWechatName, setSearchWechatName] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
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
  
  // 过滤微信用户数据
  const filteredWechatUsers = allUserIds.filter(wechatUser => {
    const matchWechatName = !searchWechatName || 
      (wechatUser.nickname && wechatUser.nickname.toLowerCase().includes(searchWechatName.toLowerCase()))
    const matchStatus = !searchStatus || wechatUser.status === searchStatus
    return matchWechatName && matchStatus
  })
  
  const totalWechatUsers = filteredWechatUsers.length
  const totalPages = Math.ceil(totalWechatUsers / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentWechatUsers = filteredWechatUsers.slice(startIndex, endIndex)

  // 统计数据
  const activeCount = filteredWechatUsers.filter(u => u.status === 'active').length
  const inactiveCount = filteredWechatUsers.filter(u => u.status === 'inactive').length

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
    setCurrentPage(1)
  }

  // 准备Excel导出数据
  const getExcelData = () => {
    const headers = [
      '序号',
      '微信账号',
      '微信名',
      '活跃状态',
      '二级用户',
      '建档数量',
      '报告数量',
      '拍照数量',
      '未读消息'
    ]

    const data = filteredWechatUsers.map((wechatUser, index) => [
      index + 1,
      wechatUser.openid || '未知账号',
      wechatUser.nickname || '未知用户',
      wechatUser.status === 'active' ? '活跃' : '非活跃',
      wechatUser.subUsers?.length || 0,
      wechatUser.verification?.archives || 0,
      wechatUser.verification?.reports || 0,
      wechatUser.verification?.photos || 0,
      wechatUser.verification?.unreadMessages || 0
    ])

    return { headers, data }
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



  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID管理</h1>
          <p className="text-gray-600">管理微信小程序用户身份认证信息</p>
        </div>
        <div className="flex space-x-3">
          <ExcelExporter
            {...getExcelData()}
            filename="ID管理数据"
            sheetName="ID管理数据"
            columnWidths={[
              { wch: 8 },   // 序号
              { wch: 30 },  // 微信账号
              { wch: 20 },  // 微信名
              { wch: 10 },  // 活跃状态
              { wch: 10 },  // 二级用户
              { wch: 10 },  // 建档数量
              { wch: 10 },  // 报告数量
              { wch: 10 },  // 拍照数量
              { wch: 10 }   // 未读消息
            ]}
            buttonText="导出数据"
            buttonClassName="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          />
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">微信名</label>
            <input
              type="text"
              value={searchWechatName}
              onChange={(e) => setSearchWechatName(e.target.value)}
              placeholder="请输入微信名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">活跃状态</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">全部</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总记录数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalWechatUsers}</p>
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
              <p className="text-sm font-medium text-gray-500">活跃用户</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
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
              <p className="text-sm font-medium text-gray-500">非活跃用户</p>
              <p className="text-2xl font-semibold text-gray-900">{inactiveCount}</p>
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
                  微信账号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  微信名
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      活跃状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      二级用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      建档数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      报告数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      拍照数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      未读消息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentWechatUsers.map((wechatUser, index) => (
                    <tr key={wechatUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{wechatUser.openid || '未知账号'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{wechatUser.nickname || '未知用户'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          wechatUser.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {wechatUser.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wechatUser.subUsers?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wechatUser.verification?.archives || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wechatUser.verification?.reports || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wechatUser.verification?.photos || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {wechatUser.verification?.unreadMessages || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => {
                            const openid = wechatUser.openid || ''
                            if (openid) {
                              router.push(`/user-management?searchUserId=${encodeURIComponent(openid)}`)
                            } else {
                              alert('该用户没有openid信息')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          子用户
                        </button>
                        <button 
                          onClick={() => {
                            const openid = wechatUser.openid || ''
                            if (openid) {
                              router.push(`/archives?searchUserId=${encodeURIComponent(openid)}`)
                            } else {
                              alert('该用户没有openid信息')
                            }
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          档案
                        </button>
                        <button 
                          onClick={() => {
                            const openid = wechatUser.openid || ''
                            if (openid) {
                              router.push(`/detections?searchUserId=${encodeURIComponent(openid)}`)
                            } else {
                              alert('该用户没有openid信息')
                            }
                          }}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          报告
                        </button>
                        <button 
                          onClick={() => handleDelete(wechatUser.id)}
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
                  显示第 {startIndex + 1} 到 {Math.min(endIndex, totalWechatUsers)} 条，共 {totalWechatUsers} 条记录
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
          </>
        )}
      </div>
    </div>
  )
} 