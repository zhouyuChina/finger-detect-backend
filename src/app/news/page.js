'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RichTextContent from '@/components/RichTextContent'
import { getLocalStorage } from '@/hooks/useLocalStorage'

export default function NewsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingNews, setViewingNews] = useState(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [allNews, setAllNews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  


  // 从数据库获取资讯数据
  const fetchNews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/news')
      const result = await response.json()
      
      if (response.ok) {
        setAllNews(result.data.data || [])
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
    fetchNews()
  }, [])
  
  // 过滤资讯数据
  const filteredNews = allNews.filter(news => {
    const matchTitle = !searchTitle || (news.title && news.title.toLowerCase().includes(searchTitle.toLowerCase()))
    const matchType = !searchType || (news.types && news.types.includes(searchType))
    const matchStatus = !searchStatus || news.status === searchStatus
    return matchTitle && matchType && matchStatus
  })
  
  const totalNews = filteredNews.length
  const totalPages = Math.ceil(totalNews / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentNews = filteredNews.slice(startIndex, endIndex)

  // 统计数据
  const publishedCount = filteredNews.filter(n => n && n.status === 'published').length
  const totalReads = filteredNews.reduce((sum, news) => sum + (news?.viewCount || 0), 0)
  const pinnedCount = filteredNews.filter(n => n && n.types && n.types.includes('置顶')).length

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



  const openViewModal = (news) => {
    setViewingNews(news)
    setShowViewModal(true)
  }



  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingNews(null)
  }



  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条资讯吗？')) return
    
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('删除成功')
        fetchNews() // 重新获取数据
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
            onClick={() => router.push('/news/add')}
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
                {publishedCount}
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
                {totalReads.toLocaleString()}
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
                {pinnedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 资讯列表 */}
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
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={news.summary || ''}>
                      {news.summary || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(news.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {news.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {news.coverImage ? (
                      <img 
                        src={news.coverImage} 
                        alt={news.title}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">无图</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {news.types && news.types.length > 0 ? (
                        news.types.map((type, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(news.status)}`}>
                      {getStatusText(news.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(news.viewCount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openViewModal(news)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      查看
                    </button>
                    <button 
                      onClick={() => router.push(`/news/edit/${news.id}`)}
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
          </>
        )}
      </div>



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
                   <label className="block text-sm font-medium text-gray-700 mb-2">摘要</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md min-h-[80px]">
                     {viewingNews.summary || '-'}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md min-h-[200px]">
                     <RichTextContent content={viewingNews.content} />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {viewingNews.category}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
                   <div className="px-3 py-2">
                     {viewingNews.coverImage ? (
                       <img 
                         src={viewingNews.coverImage} 
                         alt={viewingNews.title}
                         className="w-full max-w-md h-auto object-cover rounded"
                       />
                     ) : (
                       <div className="w-full max-w-md h-48 bg-gray-200 rounded flex items-center justify-center">
                         <span className="text-gray-400">暂无图片</span>
                       </div>
                     )}
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
                     {new Date(viewingNews.createdAt).toLocaleString('zh-CN')}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">阅读量</label>
                   <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                     {(viewingNews.viewCount || 0).toLocaleString()}
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