'use client'
import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  
  // 管理页面路径列表
  const adminPaths = useMemo(() => [
    '/dashboard',
    '/banners',
    '/news', 
    '/users',
    '/user-management',
    '/archives',
    '/detections',
    '/feedback',
    '/system-replies',
    '/coupons',
    '/company',
    '/settings'
  ], [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (pathname) {
      const adminPage = adminPaths.some(path => pathname.startsWith(path))
      setIsAdminPage(adminPage)
    }
  }, [pathname, adminPaths])

  // 服务端渲染时，默认不显示管理布局
  if (!isClient) {
    return children
  }

  if (isAdminPage) {
    return <AdminLayout>{children}</AdminLayout>
  }

  return children
} 