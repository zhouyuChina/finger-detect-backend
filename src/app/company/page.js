'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyPage() {
  const router = useRouter();
  const [companyData, setCompanyData] = useState({
    name: '',
    logo: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    wechat: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');

  // 从数据库获取企业信息
  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const token = getLocalStorage('token');
      const response = await fetch('/api/company', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        if (result.data) {
          setCompanyData(result.data);
        }
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
    fetchCompanyData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('保存中...');
    
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(companyData)
      });

      const result = await response.json();

      if (response.ok) {
        setSaveStatus('保存成功！');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          setSaveStatus('保存失败，请重试');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      }
    } catch (error) {
      setSaveStatus('保存失败，请重试');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 获取localStorage的辅助函数
  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业管理</h1>
          <p className="text-gray-600">编辑企业基本信息</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <span className={`text-sm ${saveStatus.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {saveStatus}
            </span>
          )}
          <button 
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 企业信息表单 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">企业基本信息</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* 公司名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入公司名称"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司Logo
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.logo || ''}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              placeholder="请输入Logo URL"
            />
          </div>

          {/* 公司地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司地址
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="请输入公司地址"
            />
          </div>

          {/* 联系电话 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系电话
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="请输入联系电话"
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="请输入邮箱地址"
            />
          </div>

          {/* 网站 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              官方网站
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="请输入官方网站URL"
            />
          </div>

          {/* 微信号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              微信号
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={companyData.wechat || ''}
              onChange={(e) => handleInputChange('wechat', e.target.value)}
              placeholder="请输入微信号"
            />
          </div>

          {/* 公司描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公司描述
            </label>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              value={companyData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入公司描述，支持 Markdown 格式..."
            />
            <p className="mt-2 text-sm text-gray-500">
              支持 Markdown 格式，可以包含标题、列表、表格、链接等
            </p>
          </div>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="flex justify-end">
        <button 
          className={`px-8 py-3 rounded-md text-white font-medium text-lg ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存企业信息'}
        </button>
      </div>
    </div>
  );
} 