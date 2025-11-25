// 权限管理配置文件

/**
 * 角色定义
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator'
}

/**
 * 权限定义
 */
export const PERMISSIONS = {
  // 仪表盘
  DASHBOARD_VIEW: 'dashboard:view',

  // Banner管理
  BANNER_VIEW: 'banner:view',
  BANNER_CREATE: 'banner:create',
  BANNER_EDIT: 'banner:edit',
  BANNER_DELETE: 'banner:delete',

  // 资讯管理
  NEWS_VIEW: 'news:view',
  NEWS_CREATE: 'news:create',
  NEWS_EDIT: 'news:edit',
  NEWS_DELETE: 'news:delete',

  // ID管理
  USER_ID_VIEW: 'user_id:view',
  USER_ID_DELETE: 'user_id:delete',

  // 用户管理
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',

  // 档案管理
  ARCHIVE_VIEW: 'archive:view',
  ARCHIVE_CREATE: 'archive:create',
  ARCHIVE_EDIT: 'archive:edit',
  ARCHIVE_DELETE: 'archive:delete',

  // 报告管理
  REPORT_VIEW: 'report:view',
  REPORT_EDIT: 'report:edit',
  REPORT_DELETE: 'report:delete',

  // 留言管理
  FEEDBACK_VIEW: 'feedback:view',
  FEEDBACK_REPLY: 'feedback:reply',
  FEEDBACK_DELETE: 'feedback:delete',

  // 系统消息
  SYSTEM_MESSAGE_VIEW: 'system_message:view',
  SYSTEM_MESSAGE_CREATE: 'system_message:create',
  SYSTEM_MESSAGE_EDIT: 'system_message:edit',
  SYSTEM_MESSAGE_DELETE: 'system_message:delete',

  // 优惠券管理
  COUPON_VIEW: 'coupon:view',
  COUPON_CREATE: 'coupon:create',
  COUPON_EDIT: 'coupon:edit',
  COUPON_DELETE: 'coupon:delete',

  // 数据分析
  ANALYTICS_VIEW: 'analytics:view',

  // 企业介绍
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',

  // 系统设置
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_PASSWORD: 'settings:password',
  SETTINGS_ADMIN_MANAGE: 'settings:admin_manage',
  SETTINGS_SYSTEM_CONFIG: 'settings:system_config'
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS = {
  // 超级管理员：拥有所有权限
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  // 普通管理员：除了管理员管理外的大部分权限
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BANNER_VIEW,
    PERMISSIONS.BANNER_CREATE,
    PERMISSIONS.BANNER_EDIT,
    PERMISSIONS.NEWS_VIEW,
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_EDIT,
    PERMISSIONS.USER_ID_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.ARCHIVE_VIEW,
    PERMISSIONS.ARCHIVE_CREATE,
    PERMISSIONS.ARCHIVE_EDIT,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EDIT,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.FEEDBACK_REPLY,
    PERMISSIONS.SYSTEM_MESSAGE_VIEW,
    PERMISSIONS.SYSTEM_MESSAGE_CREATE,
    PERMISSIONS.SYSTEM_MESSAGE_EDIT,
    PERMISSIONS.COUPON_VIEW,
    PERMISSIONS.COUPON_CREATE,
    PERMISSIONS.COUPON_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PASSWORD
  ],

  // 操作员：只读权限和基本操作
  [ROLES.OPERATOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BANNER_VIEW,
    PERMISSIONS.NEWS_VIEW,
    PERMISSIONS.USER_ID_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.ARCHIVE_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.SYSTEM_MESSAGE_VIEW,
    PERMISSIONS.COUPON_VIEW,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PASSWORD
  ]
}

/**
 * 路由权限映射
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': [PERMISSIONS.DASHBOARD_VIEW],
  '/banners': [PERMISSIONS.BANNER_VIEW],
  '/news': [PERMISSIONS.NEWS_VIEW],
  '/user-ids': [PERMISSIONS.USER_ID_VIEW],
  '/user-management': [PERMISSIONS.USER_VIEW],
  '/archives': [PERMISSIONS.ARCHIVE_VIEW],
  '/detections': [PERMISSIONS.REPORT_VIEW],
  '/feedback': [PERMISSIONS.FEEDBACK_VIEW],
  '/system-replies': [PERMISSIONS.SYSTEM_MESSAGE_VIEW],
  '/coupons': [PERMISSIONS.COUPON_VIEW],
  '/analytics': [PERMISSIONS.ANALYTICS_VIEW],
  '/company': [PERMISSIONS.COMPANY_VIEW],
  '/settings': [PERMISSIONS.SETTINGS_VIEW]
}

/**
 * 检查用户是否有特定权限
 * @param {string} userRole - 用户角色
 * @param {string} permission - 需要检查的权限
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * 检查用户是否可以访问路由
 * @param {string} userRole - 用户角色
 * @param {string} route - 路由路径
 * @returns {boolean}
 */
export function canAccessRoute(userRole, route) {
  // 超级管理员可以访问所有路由
  if (userRole === ROLES.SUPER_ADMIN) {
    return true
  }

  const requiredPermissions = ROUTE_PERMISSIONS[route]
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true // 没有特殊权限要求的路由允许访问
  }

  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  // 检查是否有任意一个所需权限
  return requiredPermissions.some(permission => rolePermissions.includes(permission))
}

/**
 * 获取用户所有权限
 * @param {string} userRole - 用户角色
 * @returns {string[]}
 */
export function getUserPermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * 获取用户可访问的路由列表
 * @param {string} userRole - 用户角色
 * @returns {string[]}
 */
export function getAccessibleRoutes(userRole) {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => canAccessRoute(userRole, route))
}
