'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import ExcelExporter from '@/components/ExcelExporter'

export default function UserManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 从 URL 参数初始化状态
  const initialSearchUserId = searchParams.get('searchUserId') || ''

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchUserId, setSearchUserId] = useState(initialSearchUserId)
  const [searchStatus, setSearchStatus] = useState('')
  const [searchAgeRange, setSearchAgeRange] = useState('')
  const [searchGender, setSearchGender] = useState('')
  const [searchRegion, setSearchRegion] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 使用 ref 追踪是否正在请求，防止重复请求
  const isRequestingRef = useRef(false)

  // 使用useEffect获取数据
  useEffect(() => {
    // 如果正在请求中，跳过
    if (isRequestingRef.current) {
      console.log('⏭️ 跳过重复请求')
      return
    }

    const fetchUsers = async () => {
      try {
        isRequestingRef.current = true
        setIsLoading(true)
        const params = new URLSearchParams({
          page: currentPage,
          pageSize,
          search: searchUsername,
          status: searchStatus,
          userId: searchUserId,
          ageRange: searchAgeRange,
          gender: searchGender,
          region: searchRegion
        })

        console.log('📤 准备发送的参数:', {
          page: currentPage,
          pageSize,
          search: searchUsername,
          status: searchStatus,
          userId: searchUserId,
          ageRange: searchAgeRange,
          gender: searchGender,
          region: searchRegion
        })

        // 移除空值
        Array.from(params.keys()).forEach(key => {
          if (!params.get(key)) {
            params.delete(key)
          }
        })

        const apiUrl = `/api/user-management?${params}`
        console.log('🌐 API URL:', apiUrl)

        const response = await fetch(apiUrl)
        const result = await response.json()

        console.log('🔍 API Response:', result)
        console.log('📊 Data:', result.data)
        console.log('👥 Users:', result.data?.data)

        if (response.ok) {
          setAllUsers(result.data.data || [])
          setTotalUsers(result.data.pagination?.total || 0)
          setTotalPages(result.data.pagination?.totalPages || 0)

          console.log('✅ State updated - allUsers length:', result.data.data?.length || 0)
        } else {
          setError(result.message || '获取数据失败')
        }
      } catch (err) {
        setError('网络错误，请重试')
      } finally {
        setIsLoading(false)
        // 延迟重置请求标志，避免同一个渲染周期内的多次请求
        setTimeout(() => {
          isRequestingRef.current = false
        }, 500)
      }
    }

    fetchUsers()
  }, [currentPage, pageSize, searchUsername, searchStatus, searchUserId, searchAgeRange, searchGender, searchRegion])

  // 性别映射函数
  const getGenderText = (genderValue) => {
    if (genderValue === 1 || genderValue === '1') return '男'
    if (genderValue === 2 || genderValue === '2') return '女'
    return genderValue || '-'
  }
  
  // 直接使用服务器返回的数据，不再进行客户端过滤
  const currentUsers = allUsers
  const filteredTotalUsers = totalUsers

  console.log('🖥️ Render - allUsers length:', allUsers.length)
  console.log('🖥️ Render - currentUsers length:', currentUsers.length)
  console.log('🖥️ Render - isLoading:', isLoading)
  console.log('🖥️ Render - currentPage:', currentPage)
  console.log('🖥️ Render - totalPages:', totalPages)

  if (currentUsers.length > 0) {
    console.log('🔍 First user sample:', currentUsers[0])
  }

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
    setSearchUsername('')
    setSearchUserId('')
    setSearchStatus('')
    setSearchAgeRange('')
    setSearchGender('')
    setSearchRegion('')
    setCurrentPage(1)
  }

  // 准备Excel导出数据
  const getExcelData = () => {
    const headers = [
      '序号',
      '用户名称',
      '所属ID',
      '活跃状态',
      '年龄',
      '性别',
      '地址',
      '建档数量',
      '拍照数量',
      '报告数量'
    ]

    const data = allUsers.map((user, index) => [
      index + 1,
      user.realName || '未知用户',
      user.wechatUser?.openid || '未知ID',
      user.status === 'active' ? '活跃' : user.status === 'inactive' ? '非活跃' : user.status === 'pending' ? '待审核' : '已禁用',
      user.age || '-',
      getGenderText(user.gender),
      user.address || '-',
      user.archives || 0,
      user.photos || 0,
      user.reports || 0
    ])

    return { headers, data }
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    // 编辑用户逻辑
    console.log('编辑用户:', user)
  }

  const handleDeleteUser = async (user) => {
    if (!confirm(`确定要删除用户 ${user.username} 吗？`)) return
    
    try {
      const response = await fetch(`/api/user-management/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('删除成功')
        fetchUsers() // 重新获取数据
      } else {
        if (response.status === 401) {
          // 认证失败，跳转到首页
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

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { text: '活跃', class: 'bg-green-100 text-green-800' },
      inactive: { text: '非活跃', class: 'bg-gray-100 text-gray-800' },
      pending: { text: '待审核', class: 'bg-yellow-100 text-yellow-800' },
      banned: { text: '已禁用', class: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || statusMap.inactive
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    )
  }



  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600">管理ID建立的用户信息和数据</p>
        </div>
        <div className="flex space-x-3">
          <ExcelExporter
            {...getExcelData()}
            filename="用户管理数据"
            sheetName="用户管理数据"
            columnWidths={[
              { wch: 8 },   // 序号
              { wch: 15 },  // 用户名称
              { wch: 30 },  // 所属ID
              { wch: 10 },  // 活跃状态
              { wch: 8 },   // 年龄
              { wch: 8 },   // 性别
              { wch: 20 },  // 地址
              { wch: 10 },  // 建档数量
              { wch: 10 },  // 拍照数量
              { wch: 10 }   // 报告数量
            ]}
            buttonText="导出数据"
            buttonClassName="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          />
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        
        {/* 第一排：年龄、性别、地域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">年龄段</label>
            <select
              value={searchAgeRange}
              onChange={(e) => setSearchAgeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">全部年龄</option>
              <option value="0-9">0-9岁</option>
              <option value="10-19">10-19岁</option>
              <option value="20-29">20-29岁</option>
              <option value="30-39">30-39岁</option>
              <option value="40-49">40-49岁</option>
              <option value="50-59">50-59岁</option>
              <option value="60-69">60-69岁</option>
              <option value="70-79">70-79岁</option>
              <option value="80-89">80-89岁</option>
              <option value="90+">90岁以上</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <select
              value={searchGender}
              onChange={(e) => setSearchGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">全部性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">地域</label>
            <input
              type="text"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              placeholder="请输入地域"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* 第二排：用户名称、所属ID、活跃状态 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="请输入用户名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属ID</label>
            <input
              type="text"
              value={searchUserId || ''}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="请输入所属ID"
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
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
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
              <p className="text-sm font-medium text-gray-500">总用户数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
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
              <p className="text-2xl font-semibold text-gray-900">
                {allUsers.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总建档数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allUsers.reduce((sum, user) => sum + user.archives, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
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
                <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
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
                  用户名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  所属ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活跃状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年龄
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  性别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建档数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  拍照数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报告数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.realName || '未知用户'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.wechatUser?.openid || '未知ID'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getGenderText(user.gender)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.archives}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.photos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.reports}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => {
                        const subUserId = user.id || ''
                        if (subUserId) {
                          router.push(`/archives?searchSubUserId=${encodeURIComponent(subUserId)}`)
                        } else {
                          alert('该用户没有ID信息')
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      档案
                    </button>
                    <button 
                      onClick={() => {
                        const subUserId = user.id || ''
                        if (subUserId) {
                          router.push(`/detections?searchSubUserId=${encodeURIComponent(subUserId)}`)
                        } else {
                          alert('该用户没有ID信息')
                        }
                      }}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      报告
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)}
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
              显示第 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalUsers)} 条，共 {totalUsers} 条记录
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

      {/* 用户详情模态框 */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">用户详情</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户名称</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">真实姓名</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.realName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">所属ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.userId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">年龄</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.age}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">性别</label>
                  <p className="mt-1 text-sm text-gray-900">{getGenderText(selectedUser.gender)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">地址</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">活跃状态</label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">建档数量</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.archives}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">拍照数量</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.photos}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">报告数量</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.reports}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">注册时间</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.registerDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最后登录</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.lastLogin}</p>
                </div>
                {selectedUser.remark && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">备注</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.remark}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleEditUser(selectedUser)
                    setShowModal(false)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  编辑用户
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 