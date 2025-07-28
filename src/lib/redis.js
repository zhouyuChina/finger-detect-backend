import { createClient } from 'redis'

let redis = null

// 创建Redis客户端
export async function createRedisClient() {
  if (redis) return redis
  
  // 检查是否启用Redis
  if (process.env.REDIS_ENABLED === 'false') {
    return null
  }
  
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    redis.on('error', (err) => {
      // 只在开发环境下显示详细错误
      if (process.env.NODE_ENV === 'development') {
        console.error('Redis连接错误:', err)
      }
    })
    
    await redis.connect()
    if (process.env.NODE_ENV === 'development') {
      console.log('Redis连接成功')
    }
    return redis
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Redis连接失败:', error)
    }
    return null
  }
}

// 获取Redis客户端
export async function getRedisClient() {
  if (!redis) {
    return await createRedisClient()
  }
  return redis
}

// 缓存工具函数
export async function setCache(key, value, expireSeconds = 3600) {
  try {
    const client = await getRedisClient()
    if (!client) return false
    
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    await client.setEx(key, expireSeconds, serializedValue)
    return true
  } catch (error) {
    console.error('设置缓存失败:', error)
    return false
  }
}

export async function getCache(key) {
  try {
    const client = await getRedisClient()
    if (!client) return null
    
    const value = await client.get(key)
    if (!value) return null
    
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  } catch (error) {
    console.error('获取缓存失败:', error)
    return null
  }
}

export async function deleteCache(key) {
  try {
    const client = await getRedisClient()
    if (!client) return false
    
    await client.del(key)
    return true
  } catch (error) {
    console.error('删除缓存失败:', error)
    return false
  }
}

export async function clearCache(pattern = '*') {
  try {
    const client = await getRedisClient()
    if (!client) return false
    
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
    return true
  } catch (error) {
    console.error('清除缓存失败:', error)
    return false
  }
}

// 限流工具
export async function rateLimit(key, limit, windowSeconds) {
  try {
    const client = await getRedisClient()
    if (!client) return { allowed: true, remaining: limit }
    
    const current = await client.incr(key)
    
    if (current === 1) {
      await client.expire(key, windowSeconds)
    }
    
    const remaining = Math.max(0, limit - current)
    return { allowed: current <= limit, remaining }
  } catch (error) {
    console.error('限流检查失败:', error)
    return { allowed: true, remaining: limit }
  }
} 