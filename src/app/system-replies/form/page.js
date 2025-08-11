'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SystemReplyFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const mode = searchParams.get('mode') || 'add'; // add, edit, view

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    content: '',
    status: 'unpublished'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取localStorage的辅助函数
  const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  // 获取系统消息详情
  const fetchSystemReply = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/system-replies/${id}`, {
        headers: {
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setFormData({
          title: result.data.title || '',
          type: result.data.type || '',
          content: result.data.content || '',
          status: result.data.status || 'unpublished'
        });
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

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      fetchSystemReply();
    }
  }, [id, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') return;

    try {
      setIsSubmitting(true);
      
      const url = mode === 'add' ? '/api/system-replies' : `/api/system-replies/${id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(mode === 'add' ? '添加成功' : '更新成功');
        router.push('/system-replies');
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          alert(result.message || (mode === 'add' ? '添加失败' : '更新失败'));
        }
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
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



  const getPageTitle = () => {
    switch (mode) {
      case 'add': return '新增系统消息';
      case 'edit': return '编辑系统消息';
      case 'view': return '查看系统消息';
      default: return '系统消息';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">
            {mode === 'add' && '创建新的系统消息'}
            {mode === 'edit' && '修改系统消息信息'}
            {mode === 'view' && '查看系统消息详情'}
          </p>
        </div>
        <button
          onClick={() => router.push('/system-replies')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          返回列表
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            {mode === 'view' ? (
              <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">{formData.title}</p>
            ) : (
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入标题"
              />
            )}
          </div>

          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型 <span className="text-red-500">*</span>
            </label>
            {mode === 'view' ? (
              <div className="mt-1">{getTypeBadge(formData.type)}</div>
            ) : (
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">请选择类型</option>
                <option value="system_notice">系统通知</option>
                <option value="activity_announcement">活动公告</option>
                <option value="feature_update">功能更新</option>
                <option value="maintenance_notice">维护通知</option>
                <option value="security_alert">安全提醒</option>
              </select>
            )}
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            {mode === 'view' ? (
              <div className="mt-1">{getStatusBadge(formData.status)}</div>
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="unpublished">未发布</option>
                <option value="published">已发布</option>
              </select>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容 <span className="text-red-500">*</span>
          </label>
          {mode === 'view' ? (
            <div className="text-sm text-gray-900 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
              {formData.content}
            </div>
          ) : (
            <textarea
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入系统消息内容"
            />
          )}
        </div>

        {/* 操作按钮 */}
        {mode !== 'view' && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/system-replies')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : (mode === 'add' ? '创建' : '保存')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
