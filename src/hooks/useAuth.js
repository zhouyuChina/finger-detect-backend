'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { useLocalStorage } from './useLocalStorage'

// 创建认证上下文
const AuthContext = createContext()

// 认证提供者组件
export function AuthProvider({ children }) {
  const [token, setToken] = useLocalStorage('auth_token', null)
  const [user, setUser] = useLocalStorage('auth_user', null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 初始化时检查认证状态
  useEffect(() => {
    if (token && user) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [token, user])

  // 登录函数
  const login = async (loginData) => {
    try {
      const response = await fetch('/api/miniprogram/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      const result = await response.json()

      if (result.success) {
        setToken(result.data.token)
        setUser(result.data.userInfo)
        setIsAuthenticated(true)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.message }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '登录失败，请重试' }
    }
  }

  // 登出函数
  const logout = () => {
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    // 清除其他相关存储
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  // 检查 token 是否有效
  const checkAuth = async () => {
    if (!token) {
      setIsAuthenticated(false)
      return false
    }

    try {
      const response = await fetch('/api/miniprogram/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setIsAuthenticated(true)
        return true
      } else {
        // token 无效，清除认证状态
        logout()
        return false
      }
    } catch (error) {
      console.error('验证认证状态失败:', error)
      logout()
      return false
    }
  }

  // 获取认证头
  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  // 自动刷新 token（如果需要）
  const refreshToken = async () => {
    // 这里可以实现 token 刷新逻辑
    // 目前 JWT 有效期是 7 天，暂时不需要刷新
    return true
  }

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    getAuthHeaders,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证 Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 受保护的路由组件
export function ProtectedRoute({ children, fallback = null }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>加载中...</div>
  }

  if (!isAuthenticated) {
    return fallback || <div>请先登录</div>
  }

  return children
} 