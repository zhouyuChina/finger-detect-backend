import { useMemo } from 'react'
import { hasPermission, canAccessRoute, getUserPermissions, PERMISSIONS } from '@/lib/permissions'

/**
 * 权限管理 Hook
 * @param {Object} currentAdmin - 当前登录的管理员信息（包含permissions数组）
 * @returns {Object} 权限检查方法
 */
export function usePermissions(currentAdmin) {
  const userRole = currentAdmin?.role
  const userPermissions = currentAdmin?.permissions || []

  // 检查是否有特定权限
  const checkPermission = useMemo(() => {
    return (permission) => {
      if (!userRole) return false
      // 超级管理员拥有所有权限
      if (userRole === 'super_admin') return true
      return hasPermission(userRole, permission)
    }
  }, [userRole])

  // 检查是否可以访问路由（使用数据库中的permissions）
  const checkRouteAccess = useMemo(() => {
    return (route) => {
      if (!userRole) return false
      // 超级管理员可以访问所有路由
      if (userRole === 'super_admin') return true
      // 使用数据库中存储的路由权限列表
      return userPermissions.includes(route)
    }
  }, [userRole, userPermissions])

  // 获取所有权限
  const permissions = useMemo(() => {
    if (!userRole) return []
    // 超级管理员返回所有权限
    if (userRole === 'super_admin') return getUserPermissions(userRole)
    // 普通管理员返回数据库中的路由权限列表
    return userPermissions
  }, [userRole, userPermissions])

  // 检查是否是超级管理员
  const isSuperAdmin = useMemo(() => {
    return userRole === 'super_admin'
  }, [userRole])

  // 检查是否是管理员（包括超级管理员）
  const isAdmin = useMemo(() => {
    return userRole === 'super_admin' || userRole === 'admin'
  }, [userRole])

  return {
    checkPermission,
    checkRouteAccess,
    permissions,
    isSuperAdmin,
    isAdmin,
    userRole,
    // 导出常用的权限常量，方便使用
    PERMISSIONS
  }
}
