'use client'
import { useState } from 'react'
import { useOpenidSession, miniprogramApi } from '../hooks/useOpenidSession.js'

// 使用示例组件
export default function OpenidSessionExample() {
  const { 
    openid, 
    userInfo, 
    isLoading, 
    isLoggedIn, 
    logout, 
    checkLoginStatus,
    refreshUserInfo 
  } = useOpenidSession()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  // 获取用户统计
  const handleGetStats = async () => {
    setLoading(true)
    try {
      const result = await miniprogramApi.user.getStats()
      setStats(result.data)
    } catch (error) {
      alert('获取统计失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 刷新用户信息
  const handleRefreshUser = async () => {
    const user = await refreshUserInfo()
    if (user) {
      alert('用户信息已刷新！')
    } else {
      alert('刷新失败！')
    }
  }

  // 检查登录状态
  const handleCheckStatus = async () => {
    const isValid = await checkLoginStatus()
    alert(isValid ? '登录状态有效' : '登录状态无效')
  }

  if (isLoading) {
    return <div>加载中...</div>
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">OpenID 会话管理示例</h2>
      
      {/* 登录状态显示 */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">当前状态：</h3>
        <p>登录状态: {isLoggedIn ? '✅ 已登录' : '❌ 未登录'}</p>
        {openid && <p>OpenID: {openid}</p>}
        {userInfo && (
          <div>
            <p>用户昵称: {userInfo.nickName}</p>
            <p>用户ID: {userInfo.id}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        {!isLoggedIn ? (
          <div className="text-center text-gray-500">
            请在 localStorage 中设置 openid 来测试
          </div>
        ) : (
          <>
            <button
              onClick={handleGetStats}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '获取中...' : '获取用户统计'}
            </button>
            
            <button
              onClick={handleRefreshUser}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
            >
              刷新用户信息
            </button>
            
            <button
              onClick={handleCheckStatus}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              检查登录状态
            </button>
            
            <button
              onClick={logout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              登出
            </button>
          </>
        )}
      </div>

      {/* 统计数据显示 */}
      {stats && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">用户统计：</h3>
          <ul className="space-y-1 text-sm">
            <li>拍照记录: {stats.photoRecords}</li>
            <li>报告记录: {stats.reportRecords}</li>
            <li>建档记录: {stats.profileRecords}</li>
            <li>总检测次数: {stats.totalDetections}</li>
            <li>未读消息: {stats.unreadMessages}</li>
          </ul>
        </div>
      )}

      {/* 存储信息显示 */}
      <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
        <h3 className="font-semibold mb-2">localStorage 信息：</h3>
        <p>openid: {openid || '未设置'}</p>
        <p>user_info: {userInfo ? '已设置' : '未设置'}</p>
      </div>
    </div>
  )
} 