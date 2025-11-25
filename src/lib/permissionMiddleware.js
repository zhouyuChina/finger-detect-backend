import { NextResponse } from 'next/server'
import { hasPermission, canAccessRoute, PERMISSIONS } from './permissions.js'

// Re-export PERMISSIONS for convenience
export { PERMISSIONS }

/**
 * 权限检查中间件
 * @param {Object} authResult - 认证结果，包含用户信息
 * @param {string|string[]} requiredPermissions - 需要的权限（单个或数组）
 * @param {string} operation - 操作描述（用于错误消息）
 * @returns {NextResponse|null} - 如果没有权限返回错误响应，否则返回null
 */
export function checkPermission(authResult, requiredPermissions, operation = '此操作') {
  if (!authResult || !authResult.role) {
    return NextResponse.json({
      success: false,
      message: '未找到用户角色信息'
    }, { status: 403 })
  }

  const userRole = authResult.role
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

  // 检查用户是否有任意一个所需权限
  const hasAnyPermission = permissions.some(permission => hasPermission(userRole, permission))

  if (!hasAnyPermission) {
    return NextResponse.json({
      success: false,
      message: `您没有权限执行${operation}`,
      requiredPermissions: permissions,
      userRole: userRole
    }, { status: 403 })
  }

  return null // 权限检查通过
}

/**
 * 路由访问权限检查中间件
 * @param {Object} authResult - 认证结果，包含用户信息
 * @param {string} route - 路由路径
 * @returns {NextResponse|null} - 如果没有权限返回错误响应，否则返回null
 */
export function checkRouteAccess(authResult, route) {
  if (!authResult || !authResult.role) {
    return NextResponse.json({
      success: false,
      message: '未找到用户角色信息'
    }, { status: 403 })
  }

  const userRole = authResult.role

  if (!canAccessRoute(userRole, route)) {
    return NextResponse.json({
      success: false,
      message: '您没有权限访问此页面',
      route: route,
      userRole: userRole
    }, { status: 403 })
  }

  return null // 权限检查通过
}
