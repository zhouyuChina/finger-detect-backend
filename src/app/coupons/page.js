'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CouponsPage() {
  const router = useRouter();
  const [couponsData, setCouponsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    type: 'discount',
    value: '',
    minAmount: '',
    maxDiscount: '',
    totalCount: '',
    startTime: '',
    endTime: '',
    channel: 'all',
    targetUsers: 'all',
    status: 'pending',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 从数据库获取优惠券数据
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        name: searchName,
        channel: searchChannel,
        status: searchStatus
      });
      
      const response = await fetch(`/api/coupons?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        setCouponsData(result.data.data || []);
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
    fetchCoupons();
  }, [currentPage, pageSize, searchName, searchChannel, searchStatus]);

  const totalCoupons = couponsData.length;
  const totalPages = Math.ceil(totalCoupons / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = couponsData.slice(startIndex, endIndex);

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
    setSearchName('');
    setSearchChannel('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  const handleView = (coupon) => {
    setSelectedCoupon(coupon);
    setIsViewModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setEditForm({
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      totalCount: coupon.totalCount,
      startTime: coupon.startTime ? new Date(coupon.startTime).toISOString().slice(0, 16) : '',
      endTime: coupon.endTime ? new Date(coupon.endTime).toISOString().slice(0, 16) : '',
      channel: coupon.channel,
      targetUsers: coupon.targetUsers,
      status: coupon.status,
      description: coupon.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条优惠券吗？')) return;
    
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert('删除成功');
        fetchCoupons(); // 重新获取数据
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
      const response = await fetch(`/api/coupons/${selectedCoupon.id}`, {
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
        fetchCoupons(); // 重新获取数据
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
      name: '',
      code: '',
      type: 'discount',
      value: '',
      minAmount: '',
      maxDiscount: '',
      totalCount: '',
      startTime: '',
      endTime: '',
      channel: 'all',
      targetUsers: 'all',
      status: 'pending',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    try {
      const response = await fetch('/api/coupons', {
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
        fetchCoupons(); // 重新获取数据
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
      pending: { text: '未开始', color: 'bg-gray-100 text-gray-800' },
      active: { text: '进行中', color: 'bg-green-100 text-green-800' },
      expired: { text: '已结束', color: 'bg-red-100 text-red-800' },
      paused: { text: '已暂停', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getChannelBadge = (channel) => {
    const channelMap = {
      all: { text: '全部渠道', color: 'bg-blue-100 text-blue-800' },
      wechat: { text: '微信小程序', color: 'bg-green-100 text-green-800' },
      app: { text: 'APP', color: 'bg-purple-100 text-purple-800' },
      website: { text: '官网', color: 'bg-indigo-100 text-indigo-800' },
      offline: { text: '线下门店', color: 'bg-orange-100 text-orange-800' },
      partner: { text: '合作伙伴', color: 'bg-pink-100 text-pink-800' }
    };
    const channelInfo = channelMap[channel] || { text: channel, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${channelInfo.color}`}>
        {channelInfo.text}
      </span>
    );
  };

  const getTargetUsersBadge = (targetUsers) => {
    const targetUsersMap = {
      all: { text: '全部用户', color: 'bg-blue-100 text-blue-800' },
      vip: { text: 'VIP用户', color: 'bg-purple-100 text-purple-800' },
      enterprise: { text: '企业用户', color: 'bg-green-100 text-green-800' },
      normal: { text: '普通用户', color: 'bg-gray-100 text-gray-800' },
      new: { text: '新用户', color: 'bg-yellow-100 text-yellow-800' }
    };
    const targetUsersInfo = targetUsersMap[targetUsers] || { text: targetUsers, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${targetUsersInfo.color}`}>
        {targetUsersInfo.text}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      discount: { text: '满减券', color: 'bg-blue-100 text-blue-800' },
      free: { text: '免费券', color: 'bg-green-100 text-green-800' }
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
          <h1 className="text-2xl font-bold text-gray-900">优惠券管理</h1>
          <p className="text-gray-600">管理优惠券信息和发放策略</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={handleAdd}
          >
            新增优惠券
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">🎫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">优惠券种类</p>
              <p className="text-2xl font-bold text-gray-900">{totalCoupons}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">进行中</p>
              <p className="text-2xl font-bold text-gray-900">{couponsData.filter(item => item.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">已结束</p>
              <p className="text-2xl font-bold text-gray-900">{couponsData.filter(item => item.status === 'expired').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-sm font-bold">📊</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">总张数</p>
              <p className="text-2xl font-bold text-gray-900">{couponsData.reduce((sum, item) => sum + item.totalCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索条件 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">优惠券名称</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="请输入优惠券名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">渠道</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
            >
              <option value="">全部渠道</option>
              <option value="wechat">微信小程序</option>
              <option value="app">APP</option>
              <option value="website">官网</option>
              <option value="offline">线下门店</option>
              <option value="partner">合作伙伴</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">未开始</option>
              <option value="active">进行中</option>
              <option value="expired">已结束</option>
              <option value="paused">已暂停</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">优惠券列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优惠券名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">渠道</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优惠券张数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">折扣数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发放对象</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">加载中...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-red-600">{error}</td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">暂无优惠券</td>
                </tr>
              ) : (
                currentData.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(coupon.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getChannelBadge(coupon.channel)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.totalCount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(coupon.startTime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(coupon.endTime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTargetUsersBadge(coupon.targetUsers)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(coupon.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(coupon)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
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
              显示 {startIndex + 1} 到 {Math.min(endIndex, totalCoupons)} 条，共 {totalCoupons} 条
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
                <h3 className="text-lg font-medium text-gray-900">查看优惠券详情</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {selectedCoupon && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">优惠券名称</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">渠道</label>
                      <div className="mt-1">{getChannelBadge(selectedCoupon.channel)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">优惠券张数</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.totalCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">折扣数(%)</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.value}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">开始时间</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.startTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">过期时间</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.endTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">状态</label>
                      <div className="mt-1">{getStatusBadge(selectedCoupon.status)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">发放对象</label>
                    <div className="mt-1">{getTargetUsersBadge(selectedCoupon.targetUsers)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">类型</label>
                    <div className="mt-1">{getTypeBadge(selectedCoupon.type)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <p className="text-sm text-gray-600 mt-1">{selectedCoupon.description}</p>
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
                <h3 className="text-lg font-medium text-gray-900">编辑优惠券</h3>
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
                    <label className="block text-sm font-medium text-gray-700">优惠券名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">优惠券编码</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.code || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="discount">满减券</option>
                      <option value="free">免费券</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">折扣值</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.value || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最低消费金额</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.minAmount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, minAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最大折扣金额</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.maxDiscount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">总张数</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.totalCount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, totalCount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">开始时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.startTime || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">过期时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.endTime || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">渠道</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.channel || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, channel: e.target.value }))}
                    >
                      <option value="all">全部渠道</option>
                      <option value="wechat">微信小程序</option>
                      <option value="app">APP</option>
                      <option value="website">官网</option>
                      <option value="offline">线下门店</option>
                      <option value="partner">合作伙伴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">发放对象</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.targetUsers || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                    >
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">未开始</option>
                      <option value="active">进行中</option>
                      <option value="expired">已结束</option>
                      <option value="paused">已暂停</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows="3"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
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
        </div>
      )}

      {/* 新增模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">新增优惠券</h3>
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
                    <label className="block text-sm font-medium text-gray-700">优惠券名称</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.name}
                      onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入优惠券名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">优惠券编码</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.code}
                      onChange={(e) => setAddForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="请输入优惠券编码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">类型</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.type}
                      onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="discount">满减券</option>
                      <option value="free">免费券</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">折扣值</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.value}
                      onChange={(e) => setAddForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="请输入折扣值"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最低消费金额</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.minAmount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, minAmount: e.target.value }))}
                      placeholder="请输入最低消费金额"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最大折扣金额</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.maxDiscount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                      placeholder="请输入最大折扣金额"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">总张数</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.totalCount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, totalCount: e.target.value }))}
                      placeholder="请输入总张数"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">开始时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.startTime}
                      onChange={(e) => setAddForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">过期时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.endTime}
                      onChange={(e) => setAddForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">渠道</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.channel}
                      onChange={(e) => setAddForm(prev => ({ ...prev, channel: e.target.value }))}
                    >
                      <option value="all">全部渠道</option>
                      <option value="wechat">微信小程序</option>
                      <option value="app">APP</option>
                      <option value="website">官网</option>
                      <option value="offline">线下门店</option>
                      <option value="partner">合作伙伴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">发放对象</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.targetUsers}
                      onChange={(e) => setAddForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                    >
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      value={addForm.status}
                      onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">未开始</option>
                      <option value="active">进行中</option>
                      <option value="expired">已结束</option>
                      <option value="paused">已暂停</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows="3"
                      value={addForm.description}
                      onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请输入优惠券描述"
                    />
                  </div>
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