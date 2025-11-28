'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('password');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // 当前管理员信息
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // 使用权限管理 Hook
  const { checkRouteAccess } = usePermissions(currentAdmin);

  // 新增管理员弹窗
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // 编辑管理员弹窗
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // 删除确认对话框
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  // 缓存控制：避免频繁重新加载管理员列表
  const [lastAdminFetch, setLastAdminFetch] = useState(0);

  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 管理员表单
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    permissions: []
  });

  // 系统配置表单
  const [systemForm, setSystemForm] = useState({
    siteName: '',
    siteDescription: '',
    maxUploadSize: '10',
    sessionTimeout: '30'
  });

  // 所有权限选项（与左侧菜单一致）
  const allPermissionOptions = [
    { id: '/dashboard', label: '仪表盘', icon: '📊', description: '查看系统概览' },
    { id: '/banners', label: 'Banner管理', icon: '🖼️', description: '管理轮播图' },
    { id: '/news', label: '资讯管理', icon: '📰', description: '管理资讯内容' },
    { id: '/user-ids', label: 'ID管理', icon: '🆔', description: '管理用户ID' },
    { id: '/user-management', label: '用户管理', icon: '👥', description: '管理用户信息' },
    { id: '/archives', label: '档案管理', icon: '📁', description: '管理用户档案' },
    { id: '/detections', label: '报告管理', icon: '📋', description: '查看检测报告' },
    { id: '/feedback', label: '留言管理', icon: '💌', description: '处理用户反馈' },
    { id: '/system-replies', label: '系统消息', icon: '📢', description: '管理系统消息' },
    { id: '/coupons', label: '优惠券管理', icon: '🎫', description: '管理优惠券' },
    { id: '/analytics', label: '数据分析', icon: '📈', description: '查看数据分析' },
    { id: '/company', label: '企业介绍', icon: '🏢', description: '编辑企业介绍' },
    { id: '/settings', label: '系统设置', icon: '⚙️', description: '系统配置管理' }
  ];

  // 根据当前管理员权限过滤可分配的权限选项
  const permissionOptions = useMemo(() => {
    if (!currentAdmin) return [];
    // 只显示当前管理员有权访问的路由
    return allPermissionOptions.filter(option => checkRouteAccess(option.id));
  }, [currentAdmin, checkRouteAccess]);

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAdminChange = (e) => {
    setAdminForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionChange = (permissionId, checked) => {
    setAdminForm(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveStatus('新密码与确认密码不匹配');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSaveStatus('新密码长度至少6位');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('保存中...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('密码修改成功！');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setSaveStatus(result.message || '密码修改失败');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('密码修改失败:', error);
      setSaveStatus('密码修改失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminSave = async () => {
    if (adminForm.password !== adminForm.confirmPassword) {
      setSaveStatus('密码与确认密码不匹配');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (adminForm.password.length < 6) {
      setSaveStatus('密码长度至少6位');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (adminForm.permissions.length === 0) {
      setSaveStatus('请至少选择一个权限');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('保存中...');

    try {
      // 调用 API 创建管理员
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin-management/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: adminForm.username,
          email: adminForm.email,
          password: adminForm.password,
          name: adminForm.username,
          role: adminForm.role,
          permissions: adminForm.permissions
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '创建失败');
      }

      setSaveStatus('管理员添加成功！');
      setAdminForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        permissions: []
      });

      // 刷新管理员列表(如果是超级管理员)
      if (currentAdmin?.role === 'super_admin') {
        await fetchAdmins();
      }

      // 关闭弹窗
      setShowAddAdminModal(false);

      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('管理员添加失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 编辑管理员保存
  const handleEditAdminSave = async () => {
    if (adminForm.password && adminForm.password !== adminForm.confirmPassword) {
      setSaveStatus('密码与确认密码不匹配');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (adminForm.password && adminForm.password.length < 6) {
      setSaveStatus('密码长度至少6位');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (adminForm.permissions.length === 0) {
      setSaveStatus('请至少选择一个权限');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('更新中...');

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        username: adminForm.username,
        email: adminForm.email,
        role: adminForm.role,
        permissions: adminForm.permissions
      };

      // 如果提供了密码，则包含密码
      if (adminForm.password.trim()) {
        updateData.password = adminForm.password;
      }

      const response = await fetch(`/api/admin-management/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('管理员信息更新成功！');
        setShowEditAdminModal(false);
        setEditingAdmin(null);
        setAdminForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          permissions: []
        });
        await fetchAdmins();
      } else {
        setSaveStatus(result.message || '管理员信息更新失败');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('管理员信息更新失败:', error);
      setSaveStatus('管理员信息更新失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemSave = async () => {
    setIsSaving(true);
    setSaveStatus('保存中...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(systemForm)
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('系统配置保存成功！');
      } else {
        setSaveStatus(result.message || '系统配置保存失败');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('系统配置保存失败:', error);
      setSaveStatus('系统配置保存失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 获取当前管理员信息
  useEffect(() => {
    fetchCurrentAdmin();
  }, []);

  // 当切换到管理员标签页时,如果是超级管理员则加载管理员列表
  useEffect(() => {
    if (activeTab === 'admin' && currentAdmin?.role === 'super_admin') {
      const now = Date.now();
      // 30秒缓存策略，避免频繁重新加载
      if (now - lastAdminFetch > 30000 || admins.length === 0) {
        fetchAdmins();
      }
    }
  }, [activeTab, currentAdmin, lastAdminFetch]);

  // 当切换到系统配置标签页时，加载系统配置
  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemSettings();
    }
  }, [activeTab]);

  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch('/api/admin/me');
      const result = await response.json();
      if (result.success) {
        setCurrentAdmin(result.data);
      }
    } catch (error) {
      console.error('获取当前管理员信息失败:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin-management', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAdmins(result.data);
        setLastAdminFetch(Date.now()); // 更新最后加载时间
      } else {
        setSaveStatus(result.message || '加载失败');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      setSaveStatus('加载管理员列表失败');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/system', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setSystemForm({
          siteName: result.data.siteName,
          siteDescription: result.data.siteDescription,
          maxUploadSize: String(result.data.maxUploadSize),
          sessionTimeout: String(result.data.sessionTimeout)
        });
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  };

  // 删除管理员相关函数
  const handleDeleteConfirm = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirm(true);
  };


  // 打开编辑管理员弹窗
  const handleEditAdmin = async (admin) => {
    setIsSaving(true);
    try {
      // 获取管理员的详细信息（包括权限）
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-management/${admin.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setEditingAdmin(result.data);
        // 初始化表单数据
        setAdminForm({
          username: result.data.username,
          email: result.data.email || '',
          password: '',
          confirmPassword: '',
          role: result.data.role,
          permissions: result.data.permissions || []
        });
        setShowEditAdminModal(true);
      } else {
        setSaveStatus('获取管理员信息失败');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('获取管理员信息失败:', error);
      setSaveStatus('获取管理员信息失败');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setIsSaving(true);
    setSaveStatus('删除中...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-management/${adminToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('管理员删除成功！');
        setShowDeleteConfirm(false);
        setAdminToDelete(null);
        await fetchAdmins();
      } else {
        setSaveStatus(result.message || '管理员删除失败');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('管理员删除失败:', error);
      setSaveStatus('管理员删除失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 切换管理员状态
  const toggleAdminStatus = async (admin) => {
    setIsSaving(true);
    setSaveStatus('更新中...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin-management/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !admin.isActive })
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus(`管理员${admin.isActive ? '已禁用' : '已启用'}！`);
        await fetchAdmins();
      } else {
        setSaveStatus(result.message || '状态更新失败');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('状态更新失败:', error);
      setSaveStatus('状态更新失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'password', name: '密码修改', icon: '🔐' },
    { id: 'admin', name: '管理员管理', icon: '👥' },
    { id: 'system', name: '系统配置', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600">管理系统配置和用户权限</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <span className={`text-sm ${saveStatus.includes('成功') ? 'text-green-600' : saveStatus.includes('失败') ? 'text-red-600' : 'text-blue-600'}`}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 密码修改 */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">修改密码</h3>
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入当前密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入新密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handlePasswordSave}
                      disabled={isSaving}
                      className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                        isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSaving ? '保存中...' : '修改密码'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 管理员管理 */}
          {activeTab === 'admin' && (
            <div className="space-y-8">
              {/* 管理员列表 - 只有超级管理员可见 */}
              {currentAdmin?.role === 'super_admin' ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">管理员列表</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddAdminModal(true)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        ➕ 新增管理员
                      </button>
                      <button
                        onClick={() => {
                          setLastAdminFetch(0); // 强制刷新
                          fetchAdmins();
                        }}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={isLoadingAdmins}
                      >
                        {isLoadingAdmins ? '加载中...' : '🔄 刷新'}
                      </button>
                    </div>
                  </div>

                  {isLoadingAdmins ? (
                    <div className="text-center py-8 text-gray-500">加载中...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              用户名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              姓名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              邮箱
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              角色
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              状态
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              最后登录
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {admins.map((admin) => (
                            <tr key={admin.id} className={admin.id === currentAdmin.userId ? 'bg-blue-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {admin.username}
                                  {admin.id === currentAdmin.userId && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">当前</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{admin.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{admin.email || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  admin.role === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {admin.role === 'super_admin' ? '超级管理员' : '管理员'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  admin.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {admin.isActive ? '正常' : '禁用'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('zh-CN') : '从未登录'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditAdmin(admin)}
                                    className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                                    disabled={admin.id === currentAdmin.userId}
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConfirm(admin)}
                                    className="text-red-600 hover:text-red-900 px-2 py-1 text-xs bg-red-50 rounded border border-red-200 hover:bg-red-100"
                                    disabled={admin.id === currentAdmin.userId}
                                  >
                                    删除
                                  </button>
                                  <button
                                    onClick={() => toggleAdminStatus(admin)}
                                    className={`px-2 py-1 text-xs rounded border ${
                                      admin.isActive
                                        ? 'text-orange-600 hover:text-orange-900 bg-orange-50 border-orange-200 hover:bg-orange-100'
                                        : 'text-green-600 hover:text-green-900 bg-green-50 border-green-200 hover:bg-green-100'
                                    }`}
                                    disabled={admin.id === currentAdmin.userId}
                                  >
                                    {admin.isActive ? '禁用' : '启用'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {admins.length === 0 && !isLoadingAdmins && (
                        <div className="text-center py-8 text-gray-500">暂无管理员</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">您没有权限访问管理员管理功能</p>
                  <p className="text-sm mt-2">只有超级管理员可以管理其他管理员账户</p>
                </div>
              )}
            </div>
          )}

          {/* 系统配置 */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">系统配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      系统名称
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={systemForm.siteName}
                      onChange={handleSystemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大上传大小 (MB)
                    </label>
                    <input
                      type="number"
                      name="maxUploadSize"
                      value={systemForm.maxUploadSize}
                      onChange={handleSystemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      会话超时时间 (分钟)
                    </label>
                    <input
                      type="number"
                      name="sessionTimeout"
                      value={systemForm.sessionTimeout}
                      onChange={handleSystemChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      系统描述
                    </label>
                    <textarea
                      name="siteDescription"
                      value={systemForm.siteDescription}
                      onChange={handleSystemChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleSystemSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSaving ? '保存中...' : '保存配置'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新增管理员弹窗 */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">新增管理员</h3>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={adminForm.username}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={adminForm.email}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={adminForm.password}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入密码（至少6位）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={adminForm.confirmPassword}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请再次输入密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      角色 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={adminForm.role}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="admin">管理员</option>
                      <option value="super_admin">超级管理员</option>
                      <option value="operator">操作员</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      权限设置 <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        (已选 {adminForm.permissions.length}/{permissionOptions.length})
                      </span>
                    </label>
                    {permissionOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = permissionOptions.every(p => adminForm.permissions.includes(p.id));
                          if (allSelected) {
                            // 取消全选
                            setAdminForm(prev => ({ ...prev, permissions: [] }));
                          } else {
                            // 全选
                            setAdminForm(prev => ({ ...prev, permissions: permissionOptions.map(p => p.id) }));
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {permissionOptions.every(p => adminForm.permissions.includes(p.id)) ? '取消全选' : '全选'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {permissionOptions.length > 0 ? (
                      permissionOptions.map((permission) => (
                        <label key={permission.id} className="flex items-start hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={adminForm.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{permission.icon}</span>
                              <span className="text-sm font-medium text-gray-700">{permission.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无可分配的权限</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  onClick={handleAdminSave}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSaving ? '保存中...' : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑管理员弹窗 */}
      {showEditAdminModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">编辑管理员</h3>
              <button
                onClick={() => {
                  setShowEditAdminModal(false);
                  setEditingAdmin(null);
                  setAdminForm({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'admin',
                    permissions: []
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={adminForm.username}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={adminForm.email}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码 <span className="text-gray-500 text-xs">(留空则不修改)</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={adminForm.password}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={adminForm.confirmPassword}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      角色 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={adminForm.role}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="admin">管理员</option>
                      <option value="super_admin">超级管理员</option>
                      <option value="operator">操作员</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      权限设置 <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        (已选 {adminForm.permissions.length}/{permissionOptions.length})
                      </span>
                    </label>
                    {permissionOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = permissionOptions.every(p => adminForm.permissions.includes(p.id));
                          if (allSelected) {
                            // 取消全选
                            setAdminForm(prev => ({ ...prev, permissions: [] }));
                          } else {
                            // 全选
                            setAdminForm(prev => ({ ...prev, permissions: permissionOptions.map(p => p.id) }));
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {permissionOptions.every(p => adminForm.permissions.includes(p.id)) ? '取消全选' : '全选'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {permissionOptions.length > 0 ? (
                      permissionOptions.map((permission) => (
                        <label key={permission.id} className="flex items-start hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={adminForm.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{permission.icon}</span>
                              <span className="text-sm font-medium text-gray-700">{permission.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无可分配的权限</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => {
                    setShowEditAdminModal(false);
                    setEditingAdmin(null);
                    setAdminForm({
                      username: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      role: 'admin',
                      permissions: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  onClick={handleEditAdminSave}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                您确定要删除管理员 <span className="font-bold text-red-600">&quot;{adminToDelete?.username}&quot;</span> 吗？
                <br />
                <span className="text-sm text-red-500">此操作无法撤销！</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAdminToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSaving ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 