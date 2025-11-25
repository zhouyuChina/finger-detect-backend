// 统一认证工具函数

/**
 * 获取认证token
 */
export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

/**
 * 设置认证token
 */
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

/**
 * 清除认证token（登出）
 */
export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentAdmin() {
  if (typeof window !== 'undefined') {
    const adminStr = localStorage.getItem('admin');
    if (adminStr) {
      try {
        return JSON.parse(adminStr);
      } catch (error) {
        console.error('解析管理员信息失败:', error);
        return null;
      }
    }
  }
  return null;
}

/**
 * 获取带认证的请求头
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

/**
 * 检查是否已登录
 */
export function isAuthenticated() {
  return !!getAuthToken();
}