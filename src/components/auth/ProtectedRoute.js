'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'

/**
 * 路由保护组件
 * 用于保护需要特定权限才能访问的路由
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子组件
 * @param {string|string[]} [props.requiredPermissions] - 需要的权限（可选）
 * @param {boolean} [props.requireAuth=true] - 是否需要认证（默认true）
 * @param {string} [props.fallbackPath='/'] - 无权限时重定向路径（默认'/'）
 */
export default function ProtectedRoute({
  children,
  requiredPermissions,
  requireAuth = true,
  fallbackPath = '/'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { checkPermission, checkRouteAccess } = usePermissions(currentAdmin)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 检查认证状态
      const token = localStorage.getItem('token')
      const adminStr = localStorage.getItem('admin')

      // 如果需要认证但没有token，重定向到登录页
      if (requireAuth && !token) {
        router.push(fallbackPath)
        return
      }

      // 加载管理员信息
      if (adminStr) {
        try {
          const admin = JSON.parse(adminStr)
          setCurrentAdmin(admin)
        } catch (error) {
          console.error('解析管理员信息失败:', error)
          if (requireAuth) {
            router.push(fallbackPath)
            return
          }
        }
      }

      setIsLoading(false)
    }
  }, [requireAuth, fallbackPath, router])

  useEffect(() => {
    // 如果已加载且需要权限检查
    if (!isLoading && currentAdmin) {
      // 检查路由访问权限
      if (!checkRouteAccess(pathname)) {
        console.warn(`无权访问路由: ${pathname}`)
        router.push('/dashboard') // 重定向到仪表盘
        return
      }

      // 如果指定了特定权限要求，检查这些权限
      if (requiredPermissions) {
        const permissions = Array.isArray(requiredPermissions)
          ? requiredPermissions
          : [requiredPermissions]

        const hasPermission = permissions.some(permission => checkPermission(permission))

        if (!hasPermission) {
          console.warn(`缺少必要权限: ${permissions.join(', ')}`)
          router.push('/dashboard') // 重定向到仪表盘
          return
        }
      }
    }
  }, [isLoading, currentAdmin, pathname, checkRouteAccess, checkPermission, requiredPermissions, router])

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 认证和权限检查通过，显示子组件
  return <>{children}</>
}
