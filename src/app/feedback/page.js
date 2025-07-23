'use client';

import { useState, useEffect } from 'react';

// 生成模拟数据
const generateFeedbackData = () => {
  const feedbackTypes = ['问题反馈', '功能建议', '其他'];
  const feedbackStatuses = ['待处理', '处理中', '已回复', '已关闭'];
  const users = [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
    '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六', '蒋十七'
  ];
  const contents = [
    '应用经常卡顿，希望能优化性能',
    '建议增加夜间模式功能',
    '希望增加更多的检测部位',
    '报告生成速度太慢',
    '界面设计可以更美观一些',
    '希望能支持批量导出功能',
    '检测精度需要提高',
    '用户界面操作不够直观',
    '希望能增加数据备份功能',
    '建议增加用户使用教程'
  ];
  const contacts = [
    '13800138000', '13900139000', '13700137000', '13600136000',
    '13500135000', '13400134000', '13300133000', '13200132000'
  ];
  const replies = [
    '感谢您的反馈，我们正在优化应用性能',
    '您的建议很好，我们会在下个版本中考虑添加',
    '我们会尽快处理您的问题',
    '感谢您的耐心等待，问题已解决',
    '我们会持续改进用户体验',
    '您的建议已记录，我们会认真考虑',
    '技术团队正在处理这个问题',
    '我们会尽快回复您的反馈',
    '感谢您的支持和建议',
    '我们会继续努力提供更好的服务'
  ];

  const data = [];
  for (let i = 1; i <= 35; i++) {
    const feedbackType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
    const status = feedbackStatuses[Math.floor(Math.random() * feedbackStatuses.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const content = contents[Math.floor(Math.random() * contents.length)];
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    
    // 生成随机时间（最近30天内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const feedbackTime = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);

    data.push({
      id: i,
      username: user,
      feedbackType,
      content,
      contact,
      feedbackTime: feedbackTime.toLocaleString('zh-CN'),
      status,
      reply: status === '已回复' || status === '已关闭' ? reply : '',
      unreadMessages: Math.floor(Math.random() * 5)
    });
  }
  return data;
};

export default function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const data = generateFeedbackData();
    setFeedbackData(data);
    setFilteredData(data);
  }, []);

  useEffect(() => {
    let filtered = feedbackData;

    if (searchUsername) {
      filtered = filtered.filter(item => 
        item.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
    }

    if (searchType) {
      filtered = filtered.filter(item => item.feedbackType === searchType);
    }

    if (searchStatus) {
      filtered = filtered.filter(item => item.status === searchStatus);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchUsername, searchType, searchStatus, feedbackData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  const handleEdit = (feedback) => {
    setEditForm({
      id: feedback.id,
      username: feedback.username,
      feedbackType: feedback.feedbackType,
      content: feedback.content,
      contact: feedback.contact,
      status: feedback.status,
      reply: feedback.reply
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('确定要删除这条反馈吗？')) {
      setFeedbackData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveEdit = () => {
    setFeedbackData(prev => 
      prev.map(item => 
        item.id === editForm.id ? { ...item, ...editForm } : item
      )
    );
    setIsEditModalOpen(false);
    setEditForm({});
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      '待处理': 'bg-yellow-100 text-yellow-800',
      '处理中': 'bg-blue-100 text-blue-800',
      '已回复': 'bg-green-100 text-green-800',
      '已关闭': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      '问题反馈': 'bg-red-100 text-red-800',
      '功能建议': 'bg-purple-100 text-purple-800',
      '其他': 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  // 统计数据
  const totalFeedback = feedbackData.length;
  const pendingFeedback = feedbackData.filter(item => item.status === '待处理').length;
  const processingFeedback = feedbackData.filter(item => item.status === '处理中').length;
  const repliedFeedback = feedbackData.filter(item => item.status === '已回复').length;

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
              <p className="text-2xl font-bold text-gray-900">{totalFeedback}</p>
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
              <p className="text-2xl font-bold text-gray-900">{pendingFeedback}</p>
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
              <p className="text-2xl font-bold text-gray-900">{processingFeedback}</p>
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
              <p className="text-2xl font-bold text-gray-900">{repliedFeedback}</p>
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
              <option value="问题反馈">问题反馈</option>
              <option value="功能建议">功能建议</option>
              <option value="其他">其他</option>
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
              <option value="待处理">待处理</option>
              <option value="处理中">处理中</option>
              <option value="已回复">已回复</option>
              <option value="已关闭">已关闭</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">反馈类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">反馈内容</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">反馈时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">反馈状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回复内容</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((feedback) => (
                <tr key={feedback.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feedback.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(feedback.feedbackType)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={feedback.content}>
                    {feedback.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{feedback.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{feedback.feedbackTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(feedback.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={feedback.reply}>
                    {feedback.reply || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleView(feedback)}
                      >
                        查看
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleEdit(feedback)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(feedback.id)}
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
                      <label className="block text-sm font-medium text-gray-700">用户名</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedFeedback.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈类型</label>
                      <div className="mt-1">{getTypeBadge(selectedFeedback.feedbackType)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">联系方式</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedFeedback.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈状态</label>
                      <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">反馈时间</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedFeedback.feedbackTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">未读消息</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedFeedback.unreadMessages} 条</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">反馈内容</label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedFeedback.content}
                    </p>
                  </div>
                  {selectedFeedback.reply && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">回复内容</label>
                      <p className="text-sm text-gray-600 mt-1 p-3 bg-blue-50 rounded-md">
                        {selectedFeedback.reply}
                      </p>
                    </div>
                  )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">用户名</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">反馈类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.feedbackType || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, feedbackType: e.target.value }))}
                    >
                      <option value="">请选择反馈类型</option>
                      <option value="问题反馈">问题反馈</option>
                      <option value="功能建议">功能建议</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">联系方式</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.contact || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, contact: e.target.value }))}
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
                      <option value="待处理">待处理</option>
                      <option value="处理中">处理中</option>
                      <option value="已回复">已回复</option>
                      <option value="已关闭">已关闭</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反馈内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">回复内容</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editForm.reply || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, reply: e.target.value }))}
                    placeholder="请输入回复内容"
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
    </div>
  );
} 