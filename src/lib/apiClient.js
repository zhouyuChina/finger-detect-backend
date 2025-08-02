// API 客户端工具
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL
  }

  // 获取认证头
  getAuthHeaders() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      return token ? { 'Authorization': `Bearer ${token}` } : {}
    }
    return {}
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // 合并默认选项
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // 处理 401 未授权错误
      if (response.status === 401) {
        // 清除认证信息
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
        
        // 触发重新登录
        this.handleUnauthorized()
        throw new Error('认证已过期，请重新登录')
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
  }

  // 处理未授权错误
  handleUnauthorized() {
    // 可以在这里添加重定向到登录页的逻辑
    if (typeof window !== 'undefined') {
      // 触发自定义事件，让应用知道需要重新登录
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
  }

  // GET 请求
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  // POST 请求
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT 请求
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE 请求
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  // 文件上传
  async upload(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      method: 'POST',
      body: formData,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (response.status === 401) {
        this.handleUnauthorized()
        throw new Error('认证已过期，请重新登录')
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `上传失败: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }
}

// 创建默认实例
const apiClient = new ApiClient()

// 小程序 API 专用客户端
export const miniprogramApi = {
  // 用户相关
  user: {
    // 获取用户信息
    getProfile: () => apiClient.get('/api/miniprogram/profile'),
    
    // 获取用户统计
    getStats: () => apiClient.get('/api/miniprogram/stats'),
    
    // 更新用户信息
    updateProfile: (data) => apiClient.put('/api/miniprogram/user', data),
  },

  // 检测相关
  detection: {
    // 获取检测列表
    getList: (params) => apiClient.get('/api/miniprogram/detection', { params }),
    
    // 创建检测
    create: (data) => apiClient.post('/api/miniprogram/detection', data),
    
    // 获取检测详情
    getDetail: (id) => apiClient.get(`/api/miniprogram/detection/${id}`),
  },

  // 新闻相关
  news: {
    // 获取新闻列表
    getList: () => apiClient.get('/api/miniprogram/news'),
    
    // 标记已读
    markAsRead: (data) => apiClient.post('/api/miniprogram/news/read', data),
    
    // 获取阅读状态
    getReadStatus: () => apiClient.get('/api/miniprogram/news/read'),
  },

  // 文件上传
  upload: {
    // 上传文件
    file: (formData) => apiClient.upload('/api/upload', formData),
  },

  // 认证相关
  auth: {
    // 登录
    login: (data) => apiClient.post('/api/miniprogram/register', data),
    
    // 检查认证状态
    check: () => apiClient.get('/api/miniprogram/profile'),
  },
}

// 导出通用客户端
export default apiClient 