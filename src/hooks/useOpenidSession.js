'use client'
import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

// 基于 openid 的会话管理 Hook
export function useOpenidSession() {
  const [userInfo, setUserInfo] = useLocalStorage('user_info', null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 直接从 localStorage 读取 openid
  const getOpenid = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openid')
    }
    return null
  }

  // 初始化时检查登录状态
  useEffect(() => {
    const openid = getOpenid()
    if (openid) {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  // 检查登录状态
  const checkLoginStatus = async () => {
    const openid = getOpenid()
    if (!openid) {
      setIsLoggedIn(false)
      return false
    }

    try {
      const response = await fetch('/api/miniprogram/profile', {
        headers: {
          'X-Openid': openid
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 更新用户信息
          setUserInfo(result.data)
          setIsLoggedIn(true)
          return true
        }
      }
      
      // 如果请求失败，清除登录状态
      logout()
      return false
    } catch (error) {
      console.error('检查登录状态失败:', error)
      logout()
      return false
    }
  }

  // 登出函数
  const logout = () => {
    setUserInfo(null)
    setIsLoggedIn(false)
    // 清除 localStorage 中的 openid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openid')
      localStorage.removeItem('user_info')
    }
  }

  // 获取认证头
  const getAuthHeaders = () => {
    const openid = getOpenid()
    return openid ? { 'X-Openid': openid } : {}
  }

  // 自动刷新用户信息
  const refreshUserInfo = async () => {
    const openid = getOpenid()
    if (openid) {
      try {
        const response = await fetch('/api/miniprogram/profile', {
          headers: {
            'X-Openid': openid
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setUserInfo(result.data)
            return result.data
          }
        }
      } catch (error) {
        console.error('刷新用户信息失败:', error)
      }
    }
    return null
  }

  return {
    openid: getOpenid(),
    userInfo,
    isLoading,
    isLoggedIn,
    logout,
    checkLoginStatus,
    getAuthHeaders,
    refreshUserInfo
  }
}

// 简单的 API 客户端，使用 openid 认证
export const openidApiClient = {
  // 通用请求方法
  async request(endpoint, options = {}) {
    const openid = typeof window !== 'undefined' ? localStorage.getItem('openid') : null
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(openid ? { 'X-Openid': openid } : {}),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(endpoint, config)
      
      // 处理 401 未授权错误
      if (response.status === 401) {
        // 清除登录信息
        if (typeof window !== 'undefined') {
          localStorage.removeItem('openid')
          localStorage.removeItem('user_info')
        }
        
        // 触发重新登录事件
        window.dispatchEvent(new CustomEvent('auth:expired'))
        throw new Error('登录已过期，请重新登录')
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `请求失败: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API 请求失败:', error)
      throw error
    }
  },

  // GET 请求
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  },

  // POST 请求
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // PUT 请求
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // DELETE 请求
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

// 小程序 API 专用客户端
export const miniprogramApi = {
  // 用户相关
  user: {
    // 获取用户信息
    getProfile: () => openidApiClient.get('/api/miniprogram/profile'),
    
    // 获取用户统计
    getStats: () => openidApiClient.get('/api/miniprogram/stats'),
    
    // 更新用户信息
    updateProfile: (data) => openidApiClient.put('/api/miniprogram/user', data),
  },

  // 检测相关
  detection: {
    // 获取检测列表
    getList: (params) => openidApiClient.get('/api/miniprogram/detection', { params }),
    
    // 创建检测
    create: (data) => openidApiClient.post('/api/miniprogram/detection', data),
    
    // 获取检测详情
    getDetail: (id) => openidApiClient.get(`/api/miniprogram/detection/${id}`),
  },

  // 新闻相关
  news: {
    // 获取新闻列表
    getList: () => openidApiClient.get('/api/miniprogram/news'),
    
    // 标记已读
    markAsRead: (data) => openidApiClient.post('/api/miniprogram/news/read', data),
    
    // 获取阅读状态
    getReadStatus: () => openidApiClient.get('/api/miniprogram/news/read'),
  },

  // 认证相关
  auth: {
    // 登录
    login: (data) => openidApiClient.post('/api/miniprogram/register', data),
    
    // 检查认证状态
    check: () => openidApiClient.get('/api/miniprogram/profile'),
  },
} 