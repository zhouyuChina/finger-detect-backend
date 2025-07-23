'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('password');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

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
    siteName: '指纹检测后台管理系统',
    siteDescription: '微信小程序指纹检测后台管理系统',
    maxUploadSize: '10',
    enableRegistration: true,
    enableEmailNotification: true,
    maintenanceMode: false,
    sessionTimeout: '30'
  });

  // 权限选项
  const permissionOptions = [
    { id: 'dashboard', label: '仪表盘', description: '查看系统概览' },
    { id: 'users', label: '用户管理', description: '管理用户信息' },
    { id: 'archives', label: '档案管理', description: '管理用户档案' },
    { id: 'detections', label: '检测记录', description: '查看检测记录' },
    { id: 'feedback', label: '留言管理', description: '处理用户反馈' },
    { id: 'system-replies', label: '系统回复', description: '管理系统回复' },
    { id: 'coupons', label: '优惠券管理', description: '管理优惠券' },
    { id: 'company', label: '企业管理', description: '编辑企业介绍' },
    { id: 'settings', label: '系统设置', description: '系统配置管理' }
  ];

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
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里可以添加实际的保存逻辑
      // await fetch('/api/settings/password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(passwordForm)
      // });
      
      setSaveStatus('密码修改成功！');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
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
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里可以添加实际的保存逻辑
      // await fetch('/api/settings/admin', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(adminForm)
      // });
      
      setSaveStatus('管理员添加成功！');
      setAdminForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        permissions: []
      });
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('管理员添加失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemSave = async () => {
    setIsSaving(true);
    setSaveStatus('保存中...');

    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里可以添加实际的保存逻辑
      // await fetch('/api/settings/system', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(systemForm)
      // });
      
      setSaveStatus('系统配置保存成功！');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('系统配置保存失败，请重试');
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">添加管理员</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={adminForm.username}
                        onChange={handleAdminChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        密码
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入密码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认密码
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={adminForm.confirmPassword}
                        onChange={handleAdminChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请再次输入密码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        角色
                      </label>
                      <select
                        name="role"
                        value={adminForm.role}
                        onChange={handleAdminChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">管理员</option>
                        <option value="super_admin">超级管理员</option>
                        <option value="operator">操作员</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      权限设置
                    </label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {permissionOptions.map((permission) => (
                        <label key={permission.id} className="flex items-start">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={adminForm.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-700">{permission.label}</span>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleAdminSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSaving ? '保存中...' : '添加管理员'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 系统配置 */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">系统配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系统名称
                      </label>
                      <input
                        type="text"
                        name="siteName"
                        value={systemForm.siteName}
                        onChange={handleSystemChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系统描述
                      </label>
                      <textarea
                        name="siteDescription"
                        value={systemForm.siteDescription}
                        onChange={handleSystemChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">启用用户注册</label>
                        <p className="text-xs text-gray-500">允许新用户注册账号</p>
                      </div>
                      <input
                        type="checkbox"
                        name="enableRegistration"
                        checked={systemForm.enableRegistration}
                        onChange={handleSystemChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">启用邮件通知</label>
                        <p className="text-xs text-gray-500">发送系统通知邮件</p>
                      </div>
                      <input
                        type="checkbox"
                        name="enableEmailNotification"
                        checked={systemForm.enableEmailNotification}
                        onChange={handleSystemChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">维护模式</label>
                        <p className="text-xs text-gray-500">系统维护时启用</p>
                      </div>
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={systemForm.maintenanceMode}
                        onChange={handleSystemChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
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
    </div>
  );
} 