'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchOpenid, setSearchOpenid] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 从数据库获取反馈数据
  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        userId: searchOpenid,
        type: searchType,
        status: searchStatus
      });
      
      const response = await fetch(`/api/feedbacks?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        setFeedbackData(result.data.data || []);
        setTotalFeedbacks(result.data.pagination?.total || 0);
        setTotalPages(result.data.pagination?.totalPages || 0);
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          setError(result.message || '获取数据失败');
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 使用useEffect获取数据
  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, pageSize, searchOpenid, searchType, searchStatus]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentFeedbacks = feedbackData;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchOpenid('');
    setSearchType('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  const handleView = (feedback) => {
    router.push(`/feedback/${feedback.id}?mode=view`);
  };

  const handleReply = (feedback) => {
    router.push(`/feedback/${feedback.id}?mode=reply`);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条反馈吗？')) return;
    
    try {
      const response = await fetch(`/api/feedbacks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert('删除成功');
        fetchFeedbacks(); // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          alert(result.message || '删除失败');
        }
      }
    } catch (err) {
      alert('网络错误，请重试');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { text: '已回复', color: 'bg-green-100 text-green-800' }
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      bug: { text: '问题反馈', color: 'bg-red-100 text-red-800' },
      suggestion: { text: '功能建议', color: 'bg-blue-100 text-blue-800' },
      complaint: { text: '投诉建议', color: 'bg-orange-100 text-orange-800' }
    };
    const typeInfo = typeMap[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    );
  };

  // 获取localStorage的辅助函数
  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">留言管理</h1>
          <p className="text-gray-600">管理用户反馈和留言信息</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">💬</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">总反馈数</p>
              <p className="text-2xl font-bold text-gray-900">{totalFeedbacks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-bold">待</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">待处理</p>
              <p className="text-2xl font-bold text-gray-900">{feedbackData.filter(item => item.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">复</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">已回复</p>
              <p className="text-2xl font-bold text-gray-900">{feedbackData.filter(item => item.status === 'resolved').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">微信号</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="请输入微信号"
              value={searchOpenid}
              onChange={(e) => setSearchOpenid(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈类型</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="">全部类型</option>
              <option value="bug">问题反馈</option>
              <option value="suggestion">功能建议</option>
              <option value="complaint">投诉建议</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈状态</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="resolved">已回复</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            搜索
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">留言列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  序号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  微信号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  反馈类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  反馈内容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  反馈时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
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
              ) : currentFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">暂无反馈数据</td>
                </tr>
              ) : (
                currentFeedbacks.map((feedback, index) => (
                  <tr key={feedback.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feedback.wechatUser?.nickname || feedback.wechatUser?.openid || feedback.wechatUserId || '未知'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(feedback.type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={feedback.content}>
                        {feedback.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(feedback.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(feedback)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleReply(feedback)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        回复
                      </button>
                      <button
                        onClick={() => handleDelete(feedback.id)}
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              显示第 {currentPage} 页，共 {totalFeedbacks} 条
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 