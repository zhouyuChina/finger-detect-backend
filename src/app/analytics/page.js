'use client'
import AdminLayout from '@/components/layout/AdminLayout'

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-600">数据统计和分析功能</p>
        </div>

        {/* 数据展示部分 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据分析</h2>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl text-gray-400 mb-4">📈</div>
              <div className="text-xl text-gray-500">待完善</div>
              <div className="text-sm text-gray-400 mt-2">数据分析功能正在开发中...</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
