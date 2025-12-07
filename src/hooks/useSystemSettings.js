import { useState, useEffect } from 'react'

export function useSystemSettings() {
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    maxUploadSize: 10,
    sessionTimeout: 30
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // 获取系统设置不需要认证，因为用于显示站点名称等公共信息
      const response = await fetch('/api/settings/system')
      const result = await response.json()

      if (result.success && result.data) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('获取系统设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, refresh: fetchSettings }
}
