'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemRepliesPage() {
  const router = useRouter();
  const [systemRepliesData, setSystemRepliesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchIdentity, setSearchIdentity] = useState('');
  const [selectedReply, setSelectedReply] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({
    title: '',
    type: '',
    targetUsers: 'all',
    content: '',
    status: 'draft'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 从数据库获取系统消息数据
  const fetchSystemReplies = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        title: searchTitle,
        status: searchStatus,
        targetUsers: searchIdentity
      });
      
      const response = await fetch(`/api/system-replies?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        setSystemRepliesData(result.data.data || []);
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
    fetchSystemReplies();
  }, [currentPage, pageSize, searchTitle, searchStatus, searchIdentity]);

  const totalSystemReplies = systemRepliesData.length;
  const totalPages = Math.ceil(totalSystemReplies / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = systemRepliesData.slice(startIndex, endIndex);

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
    setSearchTitle('');
    setSearchStatus('');
    setSearchIdentity('');
    setCurrentPage(1);
  };

  const handleView = (reply) => {
    setSelectedReply(reply);
    setIsViewModalOpen(true);
  };

  const handleEdit = (reply) => {
    setSelectedReply(reply);
    setEditForm({
      title: reply.title,
      type: reply.type,
      targetUsers: reply.targetUsers,
      content: reply.content,
      status: reply.status
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条系统消息吗？')) return;
    
    try {
      const response = await fetch(`/api/system-replies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert('删除成功');
        fetchSystemReplies(); // 重新获取数据
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
      const response = await fetch(`/api/system-replies/${selectedReply.id}`, {
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
        fetchSystemReplies(); // 重新获取数据
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

  const handleAdd = () => {
    setAddForm({
      title: '',
      type: '',
      targetUsers: 'all',
      content: '',
      status: 'draft'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    try {
      const response = await fetch('/api/system-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(addForm)
      });

      const result = await response.json();

      if (response.ok) {
        alert('添加成功');
        setIsAddModalOpen(false);
        fetchSystemReplies(); // 重新获取数据
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          alert(result.message || '添加失败');
        }
      }
    } catch (err) {
      alert('网络错误，请重试');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', color: 'bg-gray-100 text-gray-800' },
      published: { text: '已发布', color: 'bg-green-100 text-green-800' },
      expired: { text: '已过期', color: 'bg-red-100 text-red-800' },
      cancelled: { text: '已作废', color: 'bg-yellow-100 text-yellow-800' }
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
      system_notice: { text: '系统通知', color: 'bg-blue-100 text-blue-800' },
      activity_announcement: { text: '活动公告', color: 'bg-purple-100 text-purple-800' },
      feature_update: { text: '功能更新', color: 'bg-green-100 text-green-800' },
      maintenance_notice: { text: '维护通知', color: 'bg-orange-100 text-orange-800' },
      security_alert: { text: '安全提醒', color: 'bg-red-100 text-red-800' }
    };
    const typeInfo = typeMap[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    );
  };

  const getIdentityBadge = (identity) => {
    const identityMap = {
      all: { text: '全部用户', color: 'bg-blue-100 text-blue-800' },
      vip: { text: 'VIP用户', color: 'bg-purple-100 text-purple-800' },
      enterprise: { text: '企业用户', color: 'bg-green-100 text-green-800' },
      normal: { text: '普通用户', color: 'bg-gray-100 text-gray-800' },
      new: { text: '新用户', color: 'bg-yellow-100 text-yellow-800' }
    };
    const identityInfo = identityMap[identity] || { text: identity, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${identityInfo.color}`}>
        {identityInfo.text}
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
          <h1 className="text-2xl font-bold text-gray-900">系统消息管理</h1>
          <p className="text-gray-600">管理系统消息和公告信息</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          新增消息
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">📢</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">总消息数</p>
              <p className="text-2xl font-bold text-gray-900">{totalSystemReplies}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 text-sm font-bold">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">草稿</p>
              <p className="text-2xl font-bold text-gray-900">{systemRepliesData.filter(item => item.status === 'draft').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">已发布</p>
              <p className="text-2xl font-bold text-gray-900">{systemRepliesData.filter(item => item.status === 'published').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-sm font-bold">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">已过期</p>
              <p className="text-2xl font-bold text-gray-900">{systemRepliesData.filter(item => item.status === 'expired').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入标题"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="expired">已过期</option>
              <option value="cancelled">已作废</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">身份</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchIdentity}
              onChange={(e) => setSearchIdentity(e.target.value)}
            >
              <option value="">全部身份</option>
              <option value="all">全部用户</option>
              <option value="vip">VIP用户</option>
              <option value="enterprise">企业用户</option>
              <option value="normal">普通用户</option>
              <option value="new">新用户</option>
            </select>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">系统回复列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">身份</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已读百分比</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
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
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">暂无系统消息</td>
                </tr>
              ) : (
                currentData.map((reply) => (
                  <tr key={reply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reply.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(reply.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getIdentityBadge(reply.targetUsers)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reply.publishedAt ? new Date(reply.publishedAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(reply.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reply.totalCount > 0 ? `${Math.round((reply.readCount / reply.totalCount) * 100)}%` : '0%'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(reply)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleEdit(reply)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(reply.id)}
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
              显示 {startIndex + 1} 到 {Math.min(endIndex, totalSystemReplies)} 条，共 {totalSystemReplies} 条
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
                <h3 className="text-lg font-medium text-gray-900">查看系统回复详情</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {selectedReply && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">标题</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedReply.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">类型</label>
                      <div className="mt-1">{getTypeBadge(selectedReply.type)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">身份</label>
                      <div className="mt-1">{getIdentityBadge(selectedReply.targetUsers)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">发布状态</label>
                      <div className="mt-1">{getStatusBadge(selectedReply.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">发布时间</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedReply.publishTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">已读百分比</label>
                      <div className="flex items-center mt-1">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${selectedReply.readPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{selectedReply.readPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">内容</label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">
                      这是{selectedReply.title}的详细内容，包含了完整的系统回复信息...
                    </p>
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
                <h3 className="text-lg font-medium text-gray-900">编辑系统回复</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">标题</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">请选择类型</option>
                      <option value="system_notice">系统通知</option>
                      <option value="activity_announcement">活动公告</option>
                      <option value="feature_update">功能更新</option>
                      <option value="maintenance_notice">维护通知</option>
                      <option value="security_alert">安全提醒</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">身份</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.targetUsers || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                    >
                      <option value="">请选择身份</option>
                      <option value="all">全部用户</option>
                      <option value="vip">VIP用户</option>
                      <option value="enterprise">企业用户</option>
                      <option value="normal">普通用户</option>
                      <option value="new">新用户</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">请选择状态</option>
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                      <option value="expired">已过期</option>
                      <option value="cancelled">已作废</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="请输入系统回复内容"
                  />
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
        </div>
      )}

      {/* 新增模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">新增系统回复</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">标题</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.title}
                      onChange={(e) => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="请输入标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.type}
                      onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">请选择类型</option>
                      <option value="system_notice">系统通知</option>
                      <option value="activity_announcement">活动公告</option>
                      <option value="feature_update">功能更新</option>
                      <option value="maintenance_notice">维护通知</option>
                      <option value="security_alert">安全提醒</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">身份</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.targetUsers}
                      onChange={(e) => setAddForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                    >
                      <option value="">请选择身份</option>
                      <option value="all">全部用户</option>
                      <option value="vip">VIP用户</option>
                      <option value="enterprise">企业用户</option>
                      <option value="normal">普通用户</option>
                      <option value="new">新用户</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.status}
                      onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                      <option value="expired">已过期</option>
                      <option value="cancelled">已作废</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    value={addForm.content}
                    onChange={(e) => setAddForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="请输入系统回复内容"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    onClick={handleSaveAdd}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 