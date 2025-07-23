'use client'
import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  
  // 管理页面路径列表
  const adminPaths = [
    '/dashboard',
    '/banners',
    '/consultations', 
    '/users',
    '/archives',
    '/detections',
    '/messages',
    '/coupons',
    '/company',
    '/settings'
  ]
  
  const isAdminPage = adminPaths.some(path => pathname?.startsWith(path))

  if (isAdminPage) {
    return <AdminLayout>{children}</AdminLayout>
  }

  return children
} 