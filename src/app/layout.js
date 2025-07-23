'use client'
import { usePathname } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import "./globals.css"

export const metadata = {
  title: "指纹检测后台管理系统",
  description: "微信小程序指纹检测后台管理系统",
}

export default function RootLayout({ children }) {
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

  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {isAdminPage ? (
          <AdminLayout>{children}</AdminLayout>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
