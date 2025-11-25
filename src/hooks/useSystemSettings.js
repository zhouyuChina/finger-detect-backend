import { useState, useEffect } from 'react'

export function useSystemSettings() {
  const [settings, setSettings] = useState({
    siteName: '指纹检测后台管理系统',
    siteDescription: '微信小程序指纹检测后台管理系统',
    maxUploadSize: 10,
    sessionTimeout: 30
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
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
