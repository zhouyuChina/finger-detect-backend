'use client'
import { useState, useEffect } from 'react'

export default function UserManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // 模拟用户数据 - ID建立的用户
  const generateUsers = () => {
    const users = []
    const names = ['小明', '小红', '小李', '小王', '小张', '小赵', '小钱', '小孙', '小周', '小吴']
    const phones = ['13800138001', '13800138002', '13800138003', '13800138004', '13800138005']
    const statuses = ['active', 'inactive', 'pending', 'banned']
    const levels = ['普通用户', 'VIP用户', '高级用户', '企业用户']
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆']
    const genders = ['男', '女']
    
    for (let i = 1; i <= 50; i++) {
      users.push({
        id: i,
        username: `${names[i % names.length]}${i}`,
        phone: `${phones[i % phones.length].slice(0, -2)}${String(i).padStart(2, '0')}`,
        status: statuses[i % statuses.length],
        level: levels[i % levels.length],
        city: `${cities[i % cities.length]}市`,
        registerDate: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        lastLogin: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        email: `user${i}@example.com`,
        realName: `${names[i % names.length]}${i}`,
        idCard: `11010119900101${String(i).padStart(4, '0')}`,
        address: `${cities[i % cities.length]}市某区某街道${i}号`,
        remark: i % 3 === 0 ? `用户备注信息${i}` : '',
        // 新增字段
        age: 20 + (i % 50),
        gender: genders[i % genders.length],
        userId: `ID${String(i).padStart(3, '0')}`, // 所属ID
        archives: (i * 5) % 20, // 建档数量
        photos: (i * 7) % 50, // 拍照数量
        reports: (i * 11) % 15 // 报告数量
      })
    }
    return users
  }

  // 使用useEffect确保只在客户端生成数据
  useEffect(() => {
    setAllUsers(generateUsers())
  }, [])
  
  // 过滤用户数据
  const filteredUsers = allUsers.filter(user => {
    const matchUsername = !searchUsername || user.username.toLowerCase().includes(searchUsername.toLowerCase())
    const matchUserId = !searchPhone || user.userId.includes(searchPhone)
    const matchStatus = !searchStatus || user.status === searchStatus
    return matchUsername && matchUserId && matchStatus
  })
  
  const totalUsers = filteredUsers.length
  const totalPages = Math.ceil(totalUsers / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

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
    setSearchPhone('')
    setSearchStatus('')
    setCurrentPage(1)
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    // 编辑用户逻辑
    console.log('编辑用户:', user)
  }

  const handleDeleteUser = (user) => {
    // 删除用户逻辑
    if (confirm(`确定要删除用户 ${user.username} 吗？`)) {
      console.log('删除用户:', user)
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            新增用户
          </button>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="请输入用户名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属ID</label>
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="请输入所属ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">活跃状态</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
              <option value="pending">待审核</option>
              <option value="banned">已禁用</option>
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
                {filteredUsers.filter(u => u.status === 'active').length}
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
                {filteredUsers.reduce((sum, user) => sum + user.archives, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
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
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.realName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.gender}
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
                      onClick={() => handleViewUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      查看
                    </button>
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      编辑
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
              显示第 {startIndex + 1} 到 {Math.min(endIndex, totalUsers)} 条，共 {totalUsers} 条记录
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
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.gender}</p>
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