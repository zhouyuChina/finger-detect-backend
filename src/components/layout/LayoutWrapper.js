'use client'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()

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