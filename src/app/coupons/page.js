'use client';

import { useState, useEffect } from 'react';

// 生成模拟数据
const generateCouponsData = () => {
  const channels = ['微信小程序', 'APP', '官网', '线下门店', '合作伙伴'];
  const identities = ['全部用户', 'VIP用户', '企业用户', '普通用户', '新用户'];
  const statuses = ['未开始', '进行中', '已结束', '已暂停'];
  const couponNames = [
    '新用户专享券',
    'VIP会员优惠券',
    '春节特惠券',
    '满减优惠券',
    '折扣优惠券',
    '生日特惠券',
    '节日优惠券',
    '推荐好友券',
    '复购优惠券',
    '限时特惠券'
  ];

  const data = [];
  for (let i = 1; i <= 35; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const couponName = couponNames[Math.floor(Math.random() * couponNames.length)];
    const couponCount = Math.floor(Math.random() * 1000) + 100;
    const discount = Math.floor(Math.random() * 50) + 10;
    
    // 随机选择1-3个身份
    const selectedIdentities = [];
    const numIdentities = Math.floor(Math.random() * 3) + 1;
    const shuffledIdentities = [...identities].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numIdentities; j++) {
      selectedIdentities.push(shuffledIdentities[j]);
    }
    
    // 生成随机时间（最近30天内开始，未来30天内结束）
    const now = new Date();
    const startDays = Math.floor(Math.random() * 30);
    const durationDays = Math.floor(Math.random() * 60) + 7;
    const startTime = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

    data.push({
      id: i,
      name: `${couponName}${i}`,
      channel,
      couponCount,
      discount,
      startTime: startTime.toLocaleString('zh-CN'),
      endTime: endTime.toLocaleString('zh-CN'),
      identities: selectedIdentities,
      status
    });
  }
  return data;
};

export default function CouponsPage() {
  const [couponsData, setCouponsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
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
    channel: '',
    couponCount: '',
    discount: '',
    startTime: '',
    endTime: '',
    identities: [],
    status: '未开始'
  });

  useEffect(() => {
    const data = generateCouponsData();
    setCouponsData(data);
    setFilteredData(data);
  }, []);

  useEffect(() => {
    let filtered = couponsData;

    if (searchName) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchChannel) {
      filtered = filtered.filter(item => 
        item.channel.toLowerCase().includes(searchChannel.toLowerCase())
      );
    }

    if (searchStatus) {
      filtered = filtered.filter(item => item.status === searchStatus);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchName, searchChannel, searchStatus, couponsData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleView = (coupon) => {
    setSelectedCoupon(coupon);
    setIsViewModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setEditForm({
      id: coupon.id,
      name: coupon.name,
      channel: coupon.channel,
      couponCount: coupon.couponCount,
      discount: coupon.discount,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      identities: coupon.identities,
      status: coupon.status
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('确定要删除这张优惠券吗？')) {
      setCouponsData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveEdit = () => {
    setCouponsData(prev => 
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
    const newCoupon = {
      id: couponsData.length + 1,
      name: addForm.name,
      channel: addForm.channel,
      couponCount: parseInt(addForm.couponCount),
      discount: parseInt(addForm.discount),
      startTime: addForm.startTime,
      endTime: addForm.endTime,
      identities: addForm.identities,
      status: addForm.status
    };
    setCouponsData(prev => [newCoupon, ...prev]);
    setIsAddModalOpen(false);
    setAddForm({
      name: '',
      channel: '',
      couponCount: '',
      discount: '',
      startTime: '',
      endTime: '',
      identities: [],
      status: '未开始'
    });
  };

  const handleIdentityChange = (identity, isChecked, formType = 'add') => {
    if (formType === 'add') {
      setAddForm(prev => ({
        ...prev,
        identities: isChecked 
          ? [...prev.identities, identity]
          : prev.identities.filter(id => id !== identity)
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        identities: isChecked 
          ? [...prev.identities, identity]
          : prev.identities.filter(id => id !== identity)
      }));
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      '未开始': 'bg-gray-100 text-gray-800',
      '进行中': 'bg-green-100 text-green-800',
      '已结束': 'bg-red-100 text-red-800',
      '已暂停': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getChannelBadge = (channel) => {
    const channelColors = {
      '微信小程序': 'bg-green-100 text-green-800',
      'APP': 'bg-blue-100 text-blue-800',
      '官网': 'bg-purple-100 text-purple-800',
      '线下门店': 'bg-orange-100 text-orange-800',
      '合作伙伴': 'bg-pink-100 text-pink-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${channelColors[channel] || 'bg-gray-100 text-gray-800'}`}>
        {channel}
      </span>
    );
  };

  const getIdentitiesBadge = (identities) => {
    return (
      <div className="flex flex-wrap gap-1">
        {identities.map((identity, index) => (
          <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {identity}
          </span>
        ))}
      </div>
    );
  };

  // 统计数据
  const totalCoupons = couponsData.length;
  const activeCoupons = couponsData.filter(item => item.status === '进行中').length;
  const expiredCoupons = couponsData.filter(item => item.status === '已结束').length;
  const totalCouponCount = couponsData.reduce((sum, item) => sum + item.couponCount, 0);

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
              <p className="text-2xl font-bold text-gray-900">{activeCoupons}</p>
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
              <p className="text-2xl font-bold text-gray-900">{expiredCoupons}</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalCouponCount.toLocaleString()}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入优惠券名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">渠道</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入渠道"
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
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
              <option value="未开始">未开始</option>
              <option value="进行中">进行中</option>
              <option value="已结束">已结束</option>
              <option value="已暂停">已暂停</option>
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
              {currentData.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={coupon.name}>
                    {coupon.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getChannelBadge(coupon.channel)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.couponCount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.discount}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.startTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.endTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getIdentitiesBadge(coupon.identities)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(coupon.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleView(coupon)}
                      >
                        查看
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleEdit(coupon)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(coupon.id)}
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
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.couponCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">折扣数</label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCoupon.discount}%</p>
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
                    <div className="mt-1">{getIdentitiesBadge(selectedCoupon.identities)}</div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">渠道</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.channel || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, channel: e.target.value }))}
                    >
                      <option value="">请选择渠道</option>
                      <option value="微信小程序">微信小程序</option>
                      <option value="APP">APP</option>
                      <option value="官网">官网</option>
                      <option value="线下门店">线下门店</option>
                      <option value="合作伙伴">合作伙伴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">优惠券张数</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.couponCount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, couponCount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">折扣数(%)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.discount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">开始时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.startTime || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">过期时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.endTime || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">请选择状态</option>
                      <option value="未开始">未开始</option>
                      <option value="进行中">进行中</option>
                      <option value="已结束">已结束</option>
                      <option value="已暂停">已暂停</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">发放对象</label>
                  <div className="mt-2 space-y-2">
                    {['全部用户', 'VIP用户', '企业用户', '普通用户', '新用户'].map((identity) => (
                      <label key={identity} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={editForm.identities?.includes(identity) || false}
                          onChange={(e) => handleIdentityChange(identity, e.target.checked, 'edit')}
                        />
                        <span className="ml-2 text-sm text-gray-700">{identity}</span>
                      </label>
                    ))}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.name}
                      onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入优惠券名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">渠道</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.channel}
                      onChange={(e) => setAddForm(prev => ({ ...prev, channel: e.target.value }))}
                    >
                      <option value="">请选择渠道</option>
                      <option value="微信小程序">微信小程序</option>
                      <option value="APP">APP</option>
                      <option value="官网">官网</option>
                      <option value="线下门店">线下门店</option>
                      <option value="合作伙伴">合作伙伴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">优惠券张数</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.couponCount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, couponCount: e.target.value }))}
                      placeholder="请输入张数"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">折扣数(%)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.discount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, discount: e.target.value }))}
                      placeholder="请输入折扣"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">开始时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.startTime}
                      onChange={(e) => setAddForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">过期时间</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.endTime}
                      onChange={(e) => setAddForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addForm.status}
                      onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="未开始">未开始</option>
                      <option value="进行中">进行中</option>
                      <option value="已结束">已结束</option>
                      <option value="已暂停">已暂停</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">发放对象</label>
                  <div className="mt-2 space-y-2">
                    {['全部用户', 'VIP用户', '企业用户', '普通用户', '新用户'].map((identity) => (
                      <label key={identity} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={addForm.identities.includes(identity)}
                          onChange={(e) => handleIdentityChange(identity, e.target.checked, 'add')}
                        />
                        <span className="ml-2 text-sm text-gray-700">{identity}</span>
                      </label>
                    ))}
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