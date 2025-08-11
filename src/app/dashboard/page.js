import AdminLayout from '@/components/layout/AdminLayout'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-600">欢迎使用指纹检测后台管理系统</p>
      </div>

      {/* 数据展示部分 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">数据展示</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">📊</div>
            <div className="text-lg text-gray-500">待完成</div>
          </div>
        </div>
      </div>
    </div>
  )
} 