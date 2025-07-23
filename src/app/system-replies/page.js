'use client';

import { useState, useEffect } from 'react';

// 生成模拟数据
const generateSystemRepliesData = () => {
  const types = ['系统通知', '活动公告', '功能更新', '维护通知', '安全提醒'];
  const identities = ['全部用户', 'VIP用户', '企业用户', '普通用户', '新用户'];
  const statuses = ['草稿', '已发布', '已过期', '已作废'];
  const titles = [
    '系统维护通知',
    '新功能上线公告',
    '春节活动预告',
    '安全更新提醒',
    '用户体验优化通知',
    '服务器升级公告',
    '功能使用指南',
    '问题修复通知',
    '版本更新说明',
    '服务条款更新'
  ];

  const data = [];
  for (let i = 1; i <= 35; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const identity = identities[Math.floor(Math.random() * identities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const readPercentage = Math.floor(Math.random() * 100);
    
    // 生成随机时间（最近30天内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const publishTime = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);

    data.push({
      id: i,
      title: `${title}${i}`,
      type,
      identity,
      publishTime: publishTime.toLocaleString('zh-CN'),
      status,
      readPercentage
    });
  }
  return data;
};

export default function SystemRepliesPage() {
  const [systemRepliesData, setSystemRepliesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
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
    identity: '',
    content: '',
    status: '草稿'
  });

  useEffect(() => {
    const data = generateSystemRepliesData();
    setSystemRepliesData(data);
    setFilteredData(data);
  }, []);

  useEffect(() => {
    let filtered = systemRepliesData;

    if (searchTitle) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    if (searchStatus) {
      filtered = filtered.filter(item => item.status === searchStatus);
    }

    if (searchIdentity) {
      filtered = filtered.filter(item => item.identity === searchIdentity);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTitle, searchStatus, searchIdentity, systemRepliesData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleView = (reply) => {
    setSelectedReply(reply);
    setIsViewModalOpen(true);
  };

  const handleEdit = (reply) => {
    setEditForm({
      id: reply.id,
      title: reply.title,
      type: reply.type,
      identity: reply.identity,
      content: `这是${reply.title}的详细内容...`,
      status: reply.status
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('确定要删除这条系统回复吗？')) {
      setSystemRepliesData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveEdit = () => {
    setSystemRepliesData(prev => 
      prev.map(item => 
        item.id === editForm.id ? { ...item, ...editForm } : item
      )
    );
    setIsEditModalOpen(false);
    setEditForm({});
  };

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = () => {
    const newReply = {
      id: systemRepliesData.length + 1,
      title: addForm.title,
      type: addForm.type,
      identity: addForm.identity,
      publishTime: new Date().toLocaleString('zh-CN'),
      status: addForm.status,
      readPercentage: 0
    };
    setSystemRepliesData(prev => [newReply, ...prev]);
    setIsAddModalOpen(false);
    setAddForm({
      title: '',
      type: '',
      identity: '',
      content: '',
      status: '草稿'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      '草稿': 'bg-gray-100 text-gray-800',
      '已发布': 'bg-green-100 text-green-800',
      '已过期': 'bg-orange-100 text-orange-800',
      '已作废': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      '系统通知': 'bg-blue-100 text-blue-800',
      '活动公告': 'bg-purple-100 text-purple-800',
      '功能更新': 'bg-green-100 text-green-800',
      '维护通知': 'bg-yellow-100 text-yellow-800',
      '安全提醒': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const getIdentityBadge = (identity) => {
    const identityColors = {
      '全部用户': 'bg-blue-100 text-blue-800',
      'VIP用户': 'bg-purple-100 text-purple-800',
      '企业用户': 'bg-green-100 text-green-800',
      '普通用户': 'bg-gray-100 text-gray-800',
      '新用户': 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${identityColors[identity] || 'bg-gray-100 text-gray-800'}`}>
        {identity}
      </span>
    );
  };

  // 统计数据
  const totalReplies = systemRepliesData.length;
  const draftReplies = systemRepliesData.filter(item => item.status === '草稿').length;
  const publishedReplies = systemRepliesData.filter(item => item.status === '已发布').length;
  const expiredReplies = systemRepliesData.filter(item => item.status === '已过期').length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统回复管理</h1>
          <p className="text-gray-600">管理系统回复和公告信息</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={handleAdd}
          >
            新增回复
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">📢</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">总回复数</p>
              <p className="text-2xl font-bold text-gray-900">{totalReplies}</p>
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
              <p className="text-2xl font-bold text-gray-900">{draftReplies}</p>
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
              <p className="text-2xl font-bold text-gray-900">{publishedReplies}</p>
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
              <p className="text-2xl font-bold text-gray-900">{expiredReplies}</p>
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
              <option value="草稿">草稿</option>
              <option value="已发布">已发布</option>
              <option value="已过期">已过期</option>
              <option value="已作废">已作废</option>
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
              <option value="全部用户">全部用户</option>
              <option value="VIP用户">VIP用户</option>
              <option value="企业用户">企业用户</option>
              <option value="普通用户">普通用户</option>
              <option value="新用户">新用户</option>
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
              {currentData.map((reply) => (
                <tr key={reply.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={reply.title}>
                    {reply.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(reply.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getIdentityBadge(reply.identity)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reply.publishTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(reply.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${reply.readPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{reply.readPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleView(reply)}
                      >
                        查看
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleEdit(reply)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(reply.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              显示 {startIndex + 1} 到 {Math.min(endIndex, filteredData.length)} 条，共 {filteredData.length} 条
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
                      <div className="mt-1">{getIdentityBadge(selectedReply.identity)}</div>
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
                      <option value="系统通知">系统通知</option>
                      <option value="活动公告">活动公告</option>
                      <option value="功能更新">功能更新</option>
                      <option value="维护通知">维护通知</option>
                      <option value="安全提醒">安全提醒</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">身份</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.identity || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, identity: e.target.value }))}
                    >
                      <option value="">请选择身份</option>
                      <option value="全部用户">全部用户</option>
                      <option value="VIP用户">VIP用户</option>
                      <option value="企业用户">企业用户</option>
                      <option value="普通用户">普通用户</option>
                      <option value="新用户">新用户</option>
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
                      <option value="草稿">草稿</option>
                      <option value="已发布">已发布</option>
                      <option value="已过期">已过期</option>
                      <option value="已作废">已作废</option>
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
                      <option value="系统通知">系统通知</option>
                      <option value="活动公告">活动公告</option>
                      <option value="功能更新">功能更新</option>
                      <option value="维护通知">维护通知</option>
                      <option value="安全提醒">安全提醒</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">身份</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.identity}
                      onChange={(e) => setAddForm(prev => ({ ...prev, identity: e.target.value }))}
                    >
                      <option value="">请选择身份</option>
                      <option value="全部用户">全部用户</option>
                      <option value="VIP用户">VIP用户</option>
                      <option value="企业用户">企业用户</option>
                      <option value="普通用户">普通用户</option>
                      <option value="新用户">新用户</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.status}
                      onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="草稿">草稿</option>
                      <option value="已发布">已发布</option>
                      <option value="已过期">已过期</option>
                      <option value="已作废">已作废</option>
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