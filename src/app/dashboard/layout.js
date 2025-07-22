'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { name: '仪表盘', icon: '📊', href: '/dashboard' },
    { name: '用户管理', icon: '👥', href: '/dashboard/users' },
    { name: '检测记录', icon: '🔍', href: '/dashboard/detections' },
    { name: '数据分析', icon: '📈', href: '/dashboard/analytics' },
    { name: '系统设置', icon: '⚙️', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 左侧菜单 */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && (
            <h1 className="text-lg font-bold text-gray-800">指纹检测后台</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* 菜单列表 */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* 底部授权信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {!collapsed && (
            <div className="text-xs text-gray-500 text-center">
              <p>© 2024 指纹检测系统</p>
              <p>Version 1.0.0</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">管理后台</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 常用按钮区域 */}
            <button className="p-2 rounded-md hover:bg-gray-100">
              🔔
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100">
              ⚙️
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <span className="text-sm text-gray-700">管理员</span>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 