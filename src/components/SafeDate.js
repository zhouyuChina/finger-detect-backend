'use client'
import { useState, useEffect } from 'react'

export default function SafeDate({ date, format = 'date', locale = 'zh-CN' }) {
  const [formattedDate, setFormattedDate] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (date && isClient) {
      try {
        const dateObj = new Date(date)
        if (format === 'date') {
          setFormattedDate(dateObj.toLocaleDateString(locale))
        } else if (format === 'datetime') {
          setFormattedDate(dateObj.toLocaleString(locale))
        } else if (format === 'time') {
          setFormattedDate(dateObj.toLocaleTimeString(locale))
        } else {
          setFormattedDate(dateObj.toLocaleDateString(locale))
        }
      } catch (error) {
        setFormattedDate('-')
      }
    } else if (!date) {
      setFormattedDate('-')
    }
  }, [date, format, locale, isClient])

  // 服务端渲染时显示占位符
  if (!isClient) {
    return <span className="text-gray-400">-</span>
  }

  return <span>{formattedDate}</span>
} 