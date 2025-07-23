'use client'
import { useState, useEffect } from 'react'

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [viewingNews, setViewingNews] = useState(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [allNews, setAllNews] = useState([])
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image: '',
    types: [],
    status: 'draft'
  })

  // 模拟资讯数据
  const generateNews = () => {
    const news = []
    const titles = [
      '指纹识别技术最新突破',
      '人工智能在安防领域的应用',
      '生物识别技术发展趋势',
      '智能门锁安全性能分析',
      '移动支付安全技术探讨',
      '物联网设备安全防护',
      '区块链技术在身份认证中的应用',
      '5G时代下的网络安全挑战',
      '云计算安全架构设计',
      '数据隐私保护最佳实践'
    ]
    const descriptions = [
      '最新的指纹识别算法在准确性和速度方面都有显著提升...',
      'AI技术在安防监控、人脸识别等领域的广泛应用...',
      '生物识别技术正朝着多模态融合的方向发展...',
      '智能门锁的安全性能评估和防护措施...',
      '移动支付面临的安全挑战和解决方案...',
      '物联网设备的安全防护策略和技术手段...',
      '区块链技术如何改变传统的身份认证方式...',
      '5G网络带来的安全挑战和应对措施...',
      '云计算环境下的安全架构设计原则...',
      '数据隐私保护的法律法规和技术实现...'
    ]
    const categories = ['技术资讯', '行业动态', '产品介绍', '安全分析', '政策解读']
    const allTypes = ['置顶', '重要', '系统', '通知']
    const statuses = ['draft', 'unpublished', 'published', 'cancelled']
    
    for (let i = 1; i <= 25; i++) {
      const selectedTypes = allTypes.filter((_, index) => (i + index) % 2 === 0)
      news.push({
        id: i,
        title: `${titles[i % titles.length]}${i}`,
        description: descriptions[i % descriptions.length],
        category: categories[i % categories.length],
        image: `https://picsum.photos/300/200?random=${i}`,
        types: selectedTypes.length > 0 ? selectedTypes : [allTypes[0]],
        status: statuses[i % statuses.length],
        readCount: (i * 17) % 10000,
        createdAt: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`
      })
    }
    return news
  }

  // 使用useEffect确保只在客户端生成数据
  useEffect(() => {
    setAllNews(generateNews())
  }, [])
  
  // 过滤资讯数据
  const filteredNews = allNews.filter(news => {
    const matchTitle = !searchTitle || news.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchType = !searchType || news.types.includes(searchType)
    const matchStatus = !searchStatus || news.status === searchStatus
    return matchTitle && matchType && matchStatus
  })
  
  const totalNews = filteredNews.length
  const totalPages = Math.ceil(totalNews / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentNews = filteredNews.slice(startIndex, endIndex)

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
    setSearchTitle('')
    setSearchType('')
    setSearchStatus('')
    setCurrentPage(1)
  }

  const openModal = (news = null) => {
    if (news) {
      setEditingNews(news)
      setFormData({
        title: news.title,
        description: news.description,
        category: news.category,
        image: news.image,
        types: news.types,
        status: news.status
      })
    } else {
      setEditingNews(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        image: '',
        types: [],
        status: 'draft'
      })
    }
    setShowModal(true)
  }

  const openViewModal = (news) => {
    setViewingNews(news)
    setShowViewModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingNews(null)
    setFormData({
      title: '',
      description: '',
      category: '',
      image: '',
      types: [],
      status: 'draft'
    })
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingNews(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }

  const handleSubmit = () => {
    // 这里应该调用API保存数据
    console.log('保存资讯:', formData)
    closeModal()
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这条资讯吗？')) {
      console.log('删除资讯:', id)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      draft: '草稿',
      unpublished: '未发布',
      published: '已发布',
      cancelled: '已作废'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-gray-100 text-gray-800',
      unpublished: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资讯管理</h1>
          <p className="text-gray-600">管理新闻和文章内容</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            新增资讯
          </button>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="请输入标题"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              <option value="置顶">置顶</option>
              <option value="重要">重要</option>
              <option value="系统">系统</option>
              <option value="通知">通知</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="unpublished">未发布</option>
              <option value="published">已发布</option>
              <option value="cancelled">已作废</option>
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
                <span className="text-white text-lg">📰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总资讯数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalNews}</p>
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
              <p className="text-sm font-medium text-gray-500">已发布</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredNews.filter(n => n.status === 'published').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总阅读量</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredNews.reduce((sum, news) => sum + news.readCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-lg">🔥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">置顶资讯</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredNews.filter(n => n.types.includes('置顶')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 资讯列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">资讯列表</h2>
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
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  图片
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  阅读量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentNews.map((news) => (
                <tr key={news.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={news.title}>
                      {news.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={news.description}>
                      {news.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {news.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {news.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-12 h-8 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {news.types.map((type, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(news.status)}`}>
                      {getStatusText(news.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {news.readCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openViewModal(news)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      查看
                    </button>
                    <button 
                      onClick={() => openModal(news)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDelete(news.id)}
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
              显示第 {startIndex + 1} 到 {Math.min(endIndex, totalNews)} 条，共 {totalNews} 条记录
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
                {editingNews ? '编辑资讯' : '新增资讯'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入标题"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入描述"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入类别"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图片URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入图片URL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                  <div className="flex flex-wrap gap-2">
                    {['置顶', '重要', '系统', '通知'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.types.includes(type)}
                          onChange={() => handleTypeChange(type)}
                          className="mr-2"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">草稿</option>
                    <option value="unpublished">未发布</option>
                    <option value="published">已发布</option>
                    <option value="cancelled">已作废</option>
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

       {/* 查看资讯模态框 */}
       {showViewModal && viewingNews && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">查看资讯</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {viewingNews.title}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md min-h-[80px]">
                     {viewingNews.description}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {viewingNews.category}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
                   <div className="px-3 py-2">
                     <img 
                       src={viewingNews.image} 
                       alt={viewingNews.title}
                       className="w-full max-w-md h-auto object-cover rounded"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                   <div className="px-3 py-2">
                     <div className="flex flex-wrap gap-2">
                       {viewingNews.types.map((type, index) => (
                         <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                           {type}
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                   <div className="px-3 py-2">
                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingNews.status)}`}>
                       {getStatusText(viewingNews.status)}
                     </span>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">创建时间</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {viewingNews.createdAt}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">阅读量</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {viewingNews.readCount.toLocaleString()}
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