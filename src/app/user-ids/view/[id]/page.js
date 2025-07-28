'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getLocalStorage } from '@/hooks/useLocalStorage'
import SimpleImage from '@/components/SimpleImage'
import SafeDate from '@/components/SafeDate'

export default function ViewUserIdPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [userIdData, setUserIdData] = useState(null)

  // 获取ID记录数据
  const fetchUserId = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/user-ids/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setUserIdData(result.data)
      } else {
        setError(result.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchUserId()
    }
  }, [params.id, fetchUserId])

  const getStatusText = (status) => {
    const statusMap = {
      pending: '待审核',
      verified: '已通过',
      rejected: '已拒绝'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userIdData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">未找到ID记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">查看ID记录</h1>
          <p className="text-gray-600 mt-1">查看用户身份认证详细信息</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/user-ids')}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          返回列表
        </button>
      </div>

      {/* 用户信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">用户信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            {userIdData.user?.avatar && (
              <SimpleImage
                src={userIdData.user.avatar}
                alt={userIdData.user.nickname || '用户头像'}
                className="w-16 h-16 rounded-full mr-4"
              />
            )}
            <div>
              <h4 className="text-lg font-medium text-gray-900">{userIdData.user?.nickname || '未知用户'}</h4>
              <p className="text-sm text-gray-500">用户ID: {userIdData.user?.id}</p>
              <p className="text-sm text-gray-500">手机号: {userIdData.user?.phone || '未设置'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">OpenID: {userIdData.user?.openid}</p>
            <p className="text-sm text-gray-500">城市: {userIdData.user?.city || '未知'}</p>
            <p className="text-sm text-gray-500">省份: {userIdData.user?.province || '未知'}</p>
          </div>
        </div>
      </div>

      {/* 身份认证信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">身份认证信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              {userIdData.realName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">身份证号</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              {userIdData.idNumber}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">认证状态</label>
            <div className="px-3 py-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userIdData.verifyStatus)}`}>
                {getStatusText(userIdData.verifyStatus)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">提交时间</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              <SafeDate date={userIdData.createdAt} />
            </div>
          </div>
        </div>
      </div>

      {/* 身份证照片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">身份证照片</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">身份证正面</label>
            {userIdData.idCardFront ? (
              <SimpleImage
                src={userIdData.idCardFront}
                alt="身份证正面"
                className="w-full h-48 object-cover rounded border border-gray-300"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <span className="text-gray-400">暂无照片</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">身份证背面</label>
            {userIdData.idCardBack ? (
              <SimpleImage
                src={userIdData.idCardBack}
                alt="身份证背面"
                className="w-full h-48 object-cover rounded border border-gray-300"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <span className="text-gray-400">暂无照片</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手持身份证</label>
            {userIdData.idCardHand ? (
              <SimpleImage
                src={userIdData.idCardHand}
                alt="手持身份证"
                className="w-full h-48 object-cover rounded border border-gray-300"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <span className="text-gray-400">暂无照片</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 审核信息 */}
      {userIdData.verifyStatus !== 'pending' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">审核信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">审核时间</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                {userIdData.verifyTime ? <SafeDate date={userIdData.verifyTime} /> : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">审核人</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                {userIdData.verifyAdmin?.name || '-'}
              </div>
            </div>
            {userIdData.verifyStatus === 'rejected' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">拒绝原因</label>
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded-md">
                  {userIdData.rejectReason || '无'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 