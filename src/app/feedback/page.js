'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyForm, setReplyForm] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 从数据库获取反馈数据
  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        userId: searchUsername,
        type: searchType,
        status: searchStatus
      });
      
      const response = await fetch(`/api/feedbacks?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        setFeedbackData(result.data.data || []);
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
  }, [currentPage, pageSize, searchUsername, searchType, searchStatus]);

  const totalFeedbacks = feedbackData.length;
  const totalPages = Math.ceil(totalFeedbacks / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentFeedbacks = feedbackData.slice(startIndex, endIndex);

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
    setSearchUsername('');
    setSearchType('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyForm({
      status: feedback.status === 'pending' ? 'processing' : feedback.status,
      reply: feedback.reply || ''
    });
    setIsReplyModalOpen(true);
  };

  const handleEdit = (feedback) => {
    setSelectedFeedback(feedback);
    setEditForm({
      status: feedback.status,
      reply: feedback.reply || ''
    });
    setIsEditModalOpen(true);
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

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/feedbacks/${selectedFeedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();

      if (response.ok) {
        alert('保存成功');
        setIsEditModalOpen(false);
        fetchFeedbacks(); // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          alert(result.message || '保存失败');
        }
      }
    } catch (err) {
      alert('网络错误，请重试');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      processing: { text: '处理中', color: 'bg-blue-100 text-blue-800' },
      resolved: { text: '已回复', color: 'bg-green-100 text-green-800' },
      rejected: { text: '已关闭', color: 'bg-red-100 text-red-800' }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">中</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">处理中</p>
              <p className="text-2xl font-bold text-gray-900">{feedbackData.filter(item => item.status === 'processing').length}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">微信名</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入微信名"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈类型</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已回复</option>
              <option value="rejected">已关闭</option>
            </select>
          </div>
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
                  用户
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
                  回复状态
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
                currentFeedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feedback.user?.nickname || feedback.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(feedback.type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={feedback.content}>
                      {feedback.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(feedback.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {feedback.reply ? '已回复' : '未回复'}
                    </td>
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
              显示 {startIndex + 1} 到 {Math.min(endIndex, totalFeedbacks)} 条，共 {totalFeedbacks} 条
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

      {/* 查看模态框 */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">查看反馈详情</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {selectedFeedback && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">用户</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedFeedback.user?.nickname || selectedFeedback.userId}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈类型</label>
                      <div className="mt-1">{getTypeBadge(selectedFeedback.type)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈标题</label>
                      <div className="mt-1 text-sm text-gray-900">{selectedFeedback.title}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈内容</label>
                      <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.content}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈时间</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">状态</label>
                      <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
                    </div>
                    {selectedFeedback.reply && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">回复内容</label>
                        <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.reply}</div>
                      </div>
                    )}
                    {selectedFeedback.repliedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">回复时间</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {new Date(selectedFeedback.repliedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">编辑反馈</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedFeedback.user?.nickname || selectedFeedback.userId}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反馈类型</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={getTypeBadge(selectedFeedback.type).props.children}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反馈标题</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedFeedback.title}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反馈内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={selectedFeedback.content}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反馈状态</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">请选择反馈状态</option>
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="resolved">已回复</option>
                    <option value="rejected">已关闭</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">回复内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={editForm.reply || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, reply: e.target.value }))}
                    placeholder="请输入回复内容..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  onClick={handleSaveEdit}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 