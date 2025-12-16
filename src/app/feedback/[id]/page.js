'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

function FeedbackDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view'; // view, reply
  
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    reply: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbackDetail();
  }, [params.id]);

  const fetchFeedbackDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/feedbacks/${params.id}`);
      const result = await response.json();
      
      if (response.ok) {
        setFeedback(result.data);
        setFormData({
          status: result.data.status || '',
          reply: result.data.reply || ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.status) {
      alert('请选择反馈状态');
      return;
    }
    
    if (!formData.reply.trim()) {
      alert('请输入回复内容');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/feedbacks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getLocalStorage('token') || ''}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('回复成功');
        router.push(`/feedback/${params.id}?mode=view`);
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          router.push('/');
        } else {
          alert(result.message || '回复失败');
        }
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { text: '已回复', color: 'bg-green-100 text-green-800' }
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
      bug: { text: '问题反馈', color: 'bg-red-100 text-red-800' },
      suggestion: { text: '功能建议', color: 'bg-blue-100 text-blue-800' },
      complaint: { text: '投诉建议', color: 'bg-orange-100 text-orange-800' }
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

  const getPageTitle = () => {
    switch (mode) {
      case 'reply':
        return { title: '回复反馈', subtitle: '回复用户反馈信息' };
      default:
        return { title: '反馈详情', subtitle: '查看反馈详细信息' };
    }
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

  if (!feedback) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">反馈不存在</div>
      </div>
    );
  }

  const { title, subtitle } = getPageTitle();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <div className="flex space-x-2">
          {mode === 'view' && (
            <button
              onClick={() => router.push(`/feedback/${params.id}?mode=reply`)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              回复
            </button>
          )}
          {mode === 'reply' && (
            <button
              onClick={() => router.push(`/feedback/${params.id}?mode=view`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              返回详情
            </button>
          )}
          <button
            onClick={() => router.push('/feedback')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            返回列表
          </button>
        </div>
      </div>

      {/* 反馈信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">反馈信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户信息</label>
            <div className="text-sm text-gray-900">
              {feedback.wechatUser?.nickname || feedback.wechatUser?.openid || feedback.wechatUserId || '未知'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈类型</label>
            <div>{getTypeBadge(feedback.type)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈标题</label>
            <div className="text-sm text-gray-900">{feedback.title}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈时间</label>
            <div className="text-sm text-gray-900">
              {new Date(feedback.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">反馈内容</label>
            <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
              {feedback.content}
            </div>
          </div>
          {feedback.reply && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">回复内容</label>
              <div className="text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-md">
                {feedback.reply}
              </div>
            </div>
          )}
          {feedback.repliedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">回复时间</label>
              <div className="text-sm text-gray-900">
                {new Date(feedback.repliedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回复表单 - 仅在回复模式下显示 */}
      {mode === 'reply' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">回复表单</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                反馈状态 <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="">请选择反馈状态</option>
                <option value="pending">待处理</option>
                <option value="resolved">已回复</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回复内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={6}
                value={formData.reply}
                onChange={(e) => setFormData(prev => ({ ...prev, reply: e.target.value }))}
                placeholder="请输入回复内容..."
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => router.push(`/feedback/${params.id}?mode=view`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存回复'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function FeedbackDetailPage() {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <FeedbackDetailPageContent />
    </Suspense>
  );
}
