'use client'
import { useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'
import { useSystemSettings } from '@/hooks/useSystemSettings'

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  const { settings } = useSystemSettings()

  // 动态更新页面标题
  useEffect(() => {
    if (settings.siteName) {
      document.title = settings.siteName
    }
  }, [settings.siteName])

  const adminPaths = useMemo(
    () => [
      '/dashboard',
      '/banners',
      '/news',
      '/user-ids',
      '/user-management',
      '/archives',
      '/detections',
      '/feedback',
      '/system-replies',
      '/coupons',
      '/company',
      '/settings',
    ],
    []
  )

  const isAdminPage = useMemo(() => {
    if (!pathname) return false
    return adminPaths.some((path) => pathname.startsWith(path))
  }, [pathname, adminPaths])

  return isAdminPage ? <AdminLayout>{children}</AdminLayout> : children
}