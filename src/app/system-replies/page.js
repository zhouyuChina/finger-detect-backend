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
        status: searchStatus
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
  }, [currentPage, pageSize, searchTitle, searchStatus]);

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
    setCurrentPage(1);
  };

  const handleView = (reply) => {
    router.push(`/system-replies/form?mode=view&id=${reply.id}`);
  };

  const handleEdit = (reply) => {
    router.push(`/system-replies/form?mode=edit&id=${reply.id}`);
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

  const handleAdd = () => {
    router.push('/system-replies/form?mode=add');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      unpublished: { text: '未发布', color: 'bg-gray-100 text-gray-800' },
      published: { text: '已发布', color: 'bg-green-100 text-green-800' }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-sm font-medium text-gray-600">未发布</p>
              <p className="text-2xl font-bold text-gray-900">{systemRepliesData.filter(item => item.status === 'unpublished').length}</p>
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

      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="请输入标题"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="unpublished">未发布</option>
              <option value="published">已发布</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-4">
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
          <h3 className="text-lg font-semibold text-gray-900">系统回复列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
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
                currentData.map((reply, index) => (
                  <tr key={reply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reply.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(reply.type)}</td>

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
    </div>
  );
} 