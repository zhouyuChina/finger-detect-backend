'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280']

export default function Dashboard() {
  const [stats, setStats] = useState({
    wechatUserCount: 0,
    subUserCount: 0,
    archiveCount: 0,
    genderData: [],
    ageData: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  )

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600">欢迎使用指纹检测后台管理系统</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">⏳</div>
            <div className="text-lg text-gray-500">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-600">欢迎使用指纹检测后台管理系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="微信用户数"
          value={stats.wechatUserCount}
          icon="🆔"
          color="text-blue-600"
        />
        <StatCard
          title="用户数量"
          value={stats.subUserCount}
          icon="👥"
          color="text-green-600"
        />
        <StatCard
          title="档案数量"
          value={stats.archiveCount}
          icon="📁"
          color="text-purple-600"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 性别比例图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">用户性别比例</h2>
          {stats.genderData && stats.genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p>暂无数据</p>
              </div>
            </div>
          )}
        </div>

        {/* 年龄结构图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">年龄结构比例</h2>
          {stats.ageData && stats.ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p>暂无数据</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据详情 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">数据概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 性别分布详情 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">性别分布</h3>
            <div className="space-y-2">
              {stats.genderData && stats.genderData.length > 0 ? (
                stats.genderData.map((item, index) => {
                  const total = stats.genderData.reduce((sum, d) => sum + d.value, 0)
                  const percentage = ((item.value / total) * 100).toFixed(1)
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value} ({percentage}%)
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-400">暂无数据</p>
              )}
            </div>
          </div>

          {/* 年龄分布详情 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">年龄分布</h3>
            <div className="space-y-2">
              {stats.ageData && stats.ageData.length > 0 ? (
                stats.ageData.map((item, index) => {
                  const total = stats.ageData.reduce((sum, d) => sum + d.value, 0)
                  const percentage = ((item.value / total) * 100).toFixed(1)
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value} ({percentage}%)
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-400">暂无数据</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
