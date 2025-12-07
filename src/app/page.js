'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSystemSettings } from '@/hooks/useSystemSettings'

export default function Home() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { settings } = useSystemSettings()

  // 动态更新页面标题
  useEffect(() => {
    if (settings.siteName) {
      document.title = settings.siteName
    }
  }, [settings.siteName])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 调用后端登录 API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      const result = await response.json()

      if (result.success) {
        // 登录成功，保存 token 到 localStorage
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('admin', JSON.stringify(result.data.admin))

        // 跳转到仪表盘
        router.push('/dashboard')
      } else {
        // 登录失败，显示错误信息
        alert(result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {settings.siteName}
          </h1>
          <p className="text-gray-600">{settings.siteDescription}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>超级管理员账号：admin</p>
          <p>密码：admin123456</p>
        </div>
      </div>
    </div>
  )
}
