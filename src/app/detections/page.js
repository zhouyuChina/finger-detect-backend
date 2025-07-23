'use client'
import { useState, useEffect } from 'react'

export default function DetectionsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingDetection, setEditingDetection] = useState(null)
  const [viewingDetection, setViewingDetection] = useState(null)
  const [searchMainUser, setSearchMainUser] = useState('')
  const [searchUserNickname, setSearchUserNickname] = useState('')
  const [searchArchiveName, setSearchArchiveName] = useState('')
  const [searchBodyPart, setSearchBodyPart] = useState('')
  
  // 表单状态
  const [formData, setFormData] = useState({
    mainUser: '',
    userNickname: '',
    archiveName: '',
    bodyPart: 'finger',
    detectionTime: ''
  })

  // 模拟检测记录数据
  const generateDetections = () => {
    const detections = []
    const mainUsers = ['user001', 'user002', 'user003', 'user004', 'user005', 'user006', 'user007', 'user008', 'user009', 'user010']
    const nicknames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
    const archiveNames = [
      '指纹档案A',
      '生物识别档案B',
      '身份认证档案C',
      '安全检测档案D',
      '个人档案E',
      '企业档案F',
      'VIP档案G',
      '测试档案H',
      '演示档案I',
      '临时档案J'
    ]
    const bodyParts = ['finger', 'palm', 'face', 'iris', 'voice']
    
    for (let i = 1; i <= 40; i++) {
      detections.push({
        id: i,
        mainUser: mainUsers[i % mainUsers.length],
        userNickname: `${nicknames[i % nicknames.length]}${i}`,
        archiveName: `${archiveNames[i % archiveNames.length]}${i}`,
        bodyPart: bodyParts[i % bodyParts.length],
        detectionTime: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`
      })
    }
    return detections
  }

  const [allDetections, setAllDetections] = useState([])
  
  // 使用useEffect确保只在客户端生成数据
  useEffect(() => {
    setAllDetections(generateDetections())
  }, [])
  
  // 过滤检测记录数据
  const filteredDetections = allDetections.filter(detection => {
    const matchMainUser = !searchMainUser || detection.mainUser.toLowerCase().includes(searchMainUser.toLowerCase())
    const matchUserNickname = !searchUserNickname || detection.userNickname.toLowerCase().includes(searchUserNickname.toLowerCase())
    const matchArchiveName = !searchArchiveName || detection.archiveName.toLowerCase().includes(searchArchiveName.toLowerCase())
    const matchBodyPart = !searchBodyPart || detection.bodyPart === searchBodyPart
    return matchMainUser && matchUserNickname && matchArchiveName && matchBodyPart
  })
  
  const totalDetections = filteredDetections.length
  const totalPages = Math.ceil(totalDetections / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentDetections = filteredDetections.slice(startIndex, endIndex)

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
    setSearchMainUser('')
    setSearchUserNickname('')
    setSearchArchiveName('')
    setSearchBodyPart('')
    setCurrentPage(1)
  }

  const openModal = (detection = null) => {
    if (detection) {
      setEditingDetection(detection)
      setFormData({
        mainUser: detection.mainUser,
        userNickname: detection.userNickname,
        archiveName: detection.archiveName,
        bodyPart: detection.bodyPart,
        detectionTime: detection.detectionTime
      })
    } else {
      setEditingDetection(null)
      setFormData({
        mainUser: '',
        userNickname: '',
        archiveName: '',
        bodyPart: 'finger',
        detectionTime: ''
      })
    }
    setShowModal(true)
  }

  const openViewModal = (detection) => {
    setViewingDetection(detection)
    setShowViewModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDetection(null)
    setFormData({
      mainUser: '',
      userNickname: '',
      archiveName: '',
      bodyPart: 'finger',
      detectionTime: ''
    })
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingDetection(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = () => {
    // 这里应该调用API保存数据
    console.log('保存检测记录:', formData)
    closeModal()
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这条检测记录吗？')) {
      console.log('删除检测记录:', id)
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
      palm: 'bg-green-100 text-green-800',
      face: 'bg-purple-100 text-purple-800',
      iris: 'bg-yellow-100 text-yellow-800',
      voice: 'bg-orange-100 text-orange-800'
    }
    return colorMap[bodyPart] || 'bg-gray-100 text-gray-800'
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
            <label className="block text-sm font-medium text-gray-700 mb-2">主用户</label>
            <input
              type="text"
              value={searchMainUser}
              onChange={(e) => setSearchMainUser(e.target.value)}
              placeholder="请输入主用户ID"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">👆</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">指纹检测</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredDetections.filter(d => d.bodyPart === 'finger').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">👤</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">人脸检测</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredDetections.filter(d => d.bodyPart === 'face').length}
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
                {new Set(filteredDetections.map(d => d.mainUser)).size}
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
                  主用户
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
              {currentDetections.map((detection) => (
                <tr key={detection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{detection.mainUser}</div>
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
                    {detection.detectionTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openViewModal(detection)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      查看
                    </button>
                    <button 
                      onClick={() => openModal(detection)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDelete(detection.id)}
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

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDetection ? '编辑检测记录' : '新增检测记录'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主用户</label>
                  <input
                    type="text"
                    value={formData.mainUser}
                    onChange={(e) => handleInputChange('mainUser', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入主用户ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户昵称</label>
                  <input
                    type="text"
                    value={formData.userNickname}
                    onChange={(e) => handleInputChange('userNickname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入用户昵称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
                  <input
                    type="text"
                    value={formData.archiveName}
                    onChange={(e) => handleInputChange('archiveName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入档案名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
                  <select
                    value={formData.bodyPart}
                    onChange={(e) => handleInputChange('bodyPart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="finger">指纹</option>
                    <option value="palm">掌纹</option>
                    <option value="face">人脸</option>
                    <option value="iris">虹膜</option>
                    <option value="voice">声纹</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测时间</label>
                  <input
                    type="datetime-local"
                    value={formData.detectionTime}
                    onChange={(e) => handleInputChange('detectionTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

      {/* 查看检测记录模态框 */}
      {showViewModal && viewingDetection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">查看检测记录</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主用户</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingDetection.mainUser}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户昵称</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingDetection.userNickname}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">档案名称</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingDetection.archiveName}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测部位</label>
                  <div className="px-3 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBodyPartColor(viewingDetection.bodyPart)}`}>
                      {getBodyPartText(viewingDetection.bodyPart)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">检测时间</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {viewingDetection.detectionTime}
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