'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef(null)

  const menuItems = [
    { name: '仪表盘', icon: '📊', href: '/dashboard' },
    { name: 'Banner管理', icon: '🖼️', href: '/banners' },
    { name: '资讯管理', icon: '📰', href: '/news' },
    { name: 'ID管理', icon: '🆔', href: '/user-ids' },
    { name: '用户管理', icon: '👥', href: '/user-management' },
    { name: '档案管理', icon: '📁', href: '/archives' },
    { name: '检测记录', icon: '🔍', href: '/detections' },
    { name: '留言管理', icon: '💌', href: '/feedback' },
    { name: '系统回复', icon: '📢', href: '/system-replies' },
    { name: '优惠券管理', icon: '🎫', href: '/coupons' },
    { name: '企业介绍', icon: '🏢', href: '/company' },
    { name: '系统设置', icon: '⚙️', href: '/settings' },
  ]

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, []);

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
        <nav className="mt-4 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 底部授权信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
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
            {/* 用户菜单 */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm text-gray-700">管理员</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">管理员</p>
                    <p className="text-xs text-gray-500">admin@example.com</p>
                  </div>
                  <button
                    onClick={() => {
                      // 这里可以添加退出登录的逻辑
                      // 比如清除localStorage、cookies等
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                      }
                      // 跳转到登录页
                      router.push('/');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
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