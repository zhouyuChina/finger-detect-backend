'use client'
import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  // 状态存储当前值
  const [storedValue, setStoredValue] = useState(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // 初始化时从localStorage读取
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    }
    setIsLoaded(true)
  }, [key, initialValue])

  // 返回一个函数来设置值
  const setValue = (value) => {
    try {
      // 允许值是一个函数，这样我们就有了与useState相同的API
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded]
}

// 简单的getter函数，用于在组件外部获取值
export function getLocalStorage(key) {
  if (typeof window === 'undefined') return null
  try {
    const item = window.localStorage.getItem(key)
    if (!item) return null

    // 对于 token，直接返回字符串，不进行 JSON 解析
    if (key === 'token') {
      return item
    }

    // 其他值尝试 JSON 解析
    try {
      return JSON.parse(item)
    } catch {
      // 如果解析失败，返回原始字符串
      return item
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return null
  }
} 