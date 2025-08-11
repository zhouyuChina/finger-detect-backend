'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ArchivesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingArchive, setEditingArchive] = useState(null)
  const [viewingArchive, setViewingArchive] = useState(null)
  const [searchUserId, setSearchUserId] = useState('')
  const [searchUserName, setSearchUserName] = useState('')
  const [searchArchiveName, setSearchArchiveName] = useState('')
  const [searchActivity, setSearchActivity] = useState('')
  const [searchBodyPartType, setSearchBodyPartType] = useState('')
  const [searchBodyPartDetail, setSearchBodyPartDetail] = useState('')
  const [allArchives, setAllArchives] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 表单状态
  const [formData, setFormData] = useState({
    userId: '',
    userNickname: '',
    archiveName: '',
    activity: 'high',
    photoCount: 0,
    bodyPart: 'left_hand_thumb'
  })

  // 从数据库获取档案数据
  const fetchArchives = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        searchUserId: searchUserId,
        searchUserName: searchUserName,
        searchArchiveName: searchArchiveName,
        searchActivity: searchActivity,
        searchBodyPartType: searchBodyPartType,
        searchBodyPartDetail: searchBodyPartDetail
      })
      
      const response = await fetch(`/api/archives?${params}`)
      const result = await response.json()
      
      if (response.ok) {
        setAllArchives(result.data.data || [])
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
    fetchArchives()
  }, [currentPage, pageSize, searchUserId, searchUserName, searchArchiveName, searchActivity, searchBodyPartType, searchBodyPartDetail])

  // 处理URL参数
  useEffect(() => {
    const searchUserIdParam = searchParams.get('searchUserId')
    if (searchUserIdParam) {
      setSearchUserNickname(searchUserIdParam)
      setCurrentPage(1)
    }
  }, [searchParams])
  
  const totalArchives = allArchives.length
  const totalPages = Math.ceil(totalArchives / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentArchives = allArchives.slice(startIndex, endIndex)

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
    setSearchUserName('')
    setSearchArchiveName('')
    setSearchActivity('')
    setSearchBodyPartType('')
    setSearchBodyPartDetail('')
    setCurrentPage(1)
  }

  const openModal = (archive = null) => {
    if (archive) {
      setEditingArchive(archive)
      setFormData({
        userId: archive.userId || '',
        userNickname: archive.userNickname || '',
        archiveName: archive.archiveName || '',
        activity: archive.activity || 'high',
        photoCount: archive.photoCount || 0,
        bodyPart: archive.bodyPart || 'left_hand_thumb'
      })
    } else {
      setEditingArchive(null)
      setFormData({
        userId: '',
        userNickname: '',
        archiveName: '',
        activity: 'high',
        photoCount: 0,
        bodyPart: 'left_hand_thumb'
      })
    }
    setShowModal(true)
  }

  const openViewModal = (archive) => {
    setViewingArchive(archive)
    setShowViewModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingArchive(null)
    setFormData({
      userId: '',
      userNickname: '',
      archiveName: '',
      activity: 'high',
      photoCount: 0,
      bodyPart: 'left_hand_thumb'
    })
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingArchive(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        alert('保存成功')
        closeModal()
        fetchArchives() // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录')
          router.push('/')
        } else {
          alert(result.message || '保存失败')
        }
      }
    } catch (err) {
      alert('网络错误，请重试')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条档案记录吗？')) return
    
    try {
      const response = await fetch(`/api/archives/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('删除成功')
        fetchArchives() // 重新获取数据
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

  const getActivityText = (activity) => {
    const activityMap = {
      high: '高活跃',
      medium: '中活跃',
      low: '低活跃',
      inactive: '不活跃'
    }
    return activityMap[activity] || activity
  }

  const getActivityColor = (activity) => {
    const colorMap = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-orange-100 text-orange-800',
      inactive: 'bg-gray-100 text-gray-800'
    }
    return colorMap[activity] || 'bg-gray-100 text-gray-800'
  }



  // 检测部位选项配置
  const bodyPartOptions = {
    hand: {
      label: '手部',
      options: [
        { value: 'left_hand_thumb', label: '左手拇指' },
        { value: 'left_hand_index', label: '左手食指' },
        { value: 'left_hand_middle', label: '左手中指' },
        { value: 'left_hand_ring', label: '左手无名指' },
        { value: 'left_hand_little', label: '左手小指' },
        { value: 'right_hand_thumb', label: '右手拇指' },
        { value: 'right_hand_index', label: '右手食指' },
        { value: 'right_hand_middle', label: '右手中指' },
        { value: 'right_hand_ring', label: '右手无名指' },
        { value: 'right_hand_little', label: '右手小指' },
        { value: 'left_palm', label: '左手掌' },
        { value: 'right_palm', label: '右手掌' }
      ]
    },
    foot: {
      label: '脚部',
      options: [
        { value: 'left_foot_big', label: '左脚大脚趾' },
        { value: 'left_foot_index', label: '左脚二脚趾' },
        { value: 'left_foot_middle', label: '左脚中脚趾' },
        { value: 'left_foot_ring', label: '左脚四脚趾' },
        { value: 'left_foot_little', label: '左脚小脚趾' },
        { value: 'right_foot_big', label: '右脚大脚趾' },
        { value: 'right_foot_index', label: '右脚二脚趾' },
        { value: 'right_foot_middle', label: '右脚中脚趾' },
        { value: 'right_foot_ring', label: '右脚四脚趾' },
        { value: 'right_foot_little', label: '右脚小脚趾' }
      ]
    }
  }

  // 获取检测部位显示文本
  const getBodyPartText = (bodyPart) => {
    const allOptions = [
      ...bodyPartOptions.hand.options,
      ...bodyPartOptions.foot.options
    ]
    const option = allOptions.find(opt => opt.value === bodyPart)
    return option ? option.label : bodyPart
  }

  const getBodyPartColor = (bodyPart) => {
    if (bodyPart.startsWith('left_hand') || bodyPart.startsWith('right_hand') || bodyPart.includes('palm')) {
      return 'bg-blue-100 text-blue-800'
    } else if (bodyPart.startsWith('left_foot') || bodyPart.startsWith('right_foot') || bodyPart.includes('sole')) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-gray-900">档案管理</h1>
          <p className="text-gray-600">管理用户档案信息和数据</p>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        
        {/* 第一排：检测部位和活跃度 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">检测部位类型</label>
            <select
              value={searchBodyPartType}
              onChange={(e) => {
                setSearchBodyPartType(e.target.value)
                setSearchBodyPartDetail('') // 清空具体部位选择
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">全部类型</option>
              <option value="left_hand">左手</option>
              <option value="right_hand">右手</option>
              <option value="left_foot">左脚</option>
              <option value="right_foot">右脚</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">具体部位</label>
            <select
              value={searchBodyPartDetail}
              onChange={(e) => setSearchBodyPartDetail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={!searchBodyPartType}
            >
              <option value="">请先选择类型</option>
              {searchBodyPartType && bodyPartOptions[searchBodyPartType.includes('hand') ? 'hand' : 'foot']?.options
                .filter(option => option.value.startsWith(searchBodyPartType))
                .map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">活跃度</label>
            <select
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">全部活跃度</option>
              <option value="high">高活跃</option>
              <option value="medium">中活跃</option>
              <option value="low">低活跃</option>
              <option value="inactive">不活跃</option>
            </select>
          </div>
        </div>



        {/* 第二排：所属ID、用户名称、档案名称 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属ID</label>
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
            <input
              type="text"
              value={searchArchiveName}
              onChange={(e) => setSearchArchiveName(e.target.value)}
              placeholder="请输入档案名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
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

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">📁</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总档案数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalArchives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">🔥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">高活跃档案</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allArchives.filter(a => a.activity === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">📸</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总拍照数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allArchives.reduce((sum, archive) => sum + (archive.photoCount || 0), 0).toLocaleString()}
              </p>
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
                {new Set(allArchives.filter(a => a.activity !== 'inactive').map(a => a.userId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 档案列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">档案列表</h2>
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
                  档案活跃度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  拍照数量
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
              {currentArchives.map((archive, index) => (
                <tr key={archive.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{archive.userId || '未知'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{archive.userNickname || '未知'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{archive.archiveName || '未知'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(archive.activity || 'inactive')}`}>
                      {getActivityText(archive.activity || 'inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(archive.photoCount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {archive.detectionTime ? new Date(archive.detectionTime).toLocaleString('zh-CN') : '未知时间'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => console.log('查看图片功能待实现')}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      查看图片
                    </button>
                    <button 
                      onClick={() => console.log('导出图片功能待实现')}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      导出图片
                    </button>
                    <button 
                      onClick={() => {
                        const archiveName = archive.archiveName || ''
                        if (archiveName) {
                          router.push(`/detections?searchUserId=${encodeURIComponent(archiveName)}`)
                        } else {
                          alert('该档案没有档案名称信息')
                        }
                      }}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      报告
                    </button>
                    <button 
                      onClick={() => handleDelete(archive.id)}
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
              显示第 {startIndex + 1} 到 {Math.min(endIndex, totalArchives)} 条，共 {totalArchives} 条记录
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

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingArchive ? '编辑档案' : '新增档案'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主用户</label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="请输入主用户ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
                  <input
                    type="text"
                    value={formData.userNickname}
                    onChange={(e) => handleInputChange('userNickname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="请输入用户名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
                  <input
                    type="text"
                    value={formData.archiveName}
                    onChange={(e) => handleInputChange('archiveName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="请输入档案名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案活跃度</label>
                  <select
                    value={formData.activity}
                    onChange={(e) => handleInputChange('activity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="high">高活跃</option>
                    <option value="medium">中活跃</option>
                    <option value="low">低活跃</option>
                    <option value="inactive">不活跃</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">拍照数量</label>
                  <input
                    type="number"
                    value={formData.photoCount}
                    onChange={(e) => handleInputChange('photoCount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="请输入拍照数量"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
                  <select
                    value={formData.bodyPart}
                    onChange={(e) => handleInputChange('bodyPart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="left_hand_thumb">左手拇指</option>
                    <option value="left_hand_index">左手食指</option>
                    <option value="left_hand_middle">左手中指</option>
                    <option value="left_hand_ring">左手无名指</option>
                    <option value="left_hand_little">左手小指</option>
                    <option value="right_hand_thumb">右手拇指</option>
                    <option value="right_hand_index">右手食指</option>
                    <option value="right_hand_middle">右手中指</option>
                    <option value="right_hand_ring">右手无名指</option>
                    <option value="right_hand_little">右手小指</option>
                    <option value="left_palm">左手掌</option>
                    <option value="right_palm">右手掌</option>
                    <option value="left_foot_big">左脚大脚趾</option>
                    <option value="left_foot_index">左脚二脚趾</option>
                    <option value="left_foot_middle">左脚中脚趾</option>
                    <option value="left_foot_ring">左脚四脚趾</option>
                    <option value="left_foot_little">左脚小脚趾</option>
                    <option value="right_foot_big">右脚大脚趾</option>
                    <option value="right_foot_index">右脚二脚趾</option>
                    <option value="right_foot_middle">右脚中脚趾</option>
                    <option value="right_foot_ring">右脚四脚趾</option>
                    <option value="right_foot_little">右脚小脚趾</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看档案模态框 */}
      {showViewModal && viewingArchive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">查看档案</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主用户</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingArchive.userId || '未知'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名称</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingArchive.userNickname || '未知'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingArchive.archiveName || '未知'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案活跃度</label>
                  <div className="px-3 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(viewingArchive.activity || 'inactive')}`}>
                      {getActivityText(viewingArchive.activity || 'inactive')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">拍照数量</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {(viewingArchive.photoCount || 0).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
                  <div className="px-3 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBodyPartColor(viewingArchive.bodyPart || 'left_hand_thumb')}`}>
                      {getBodyPartText(viewingArchive.bodyPart || 'left_hand_thumb')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测时间</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingArchive.detectionTime || '未知时间'}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 