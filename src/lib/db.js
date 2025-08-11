import { PrismaClient } from '../generated/prisma/index.js'
import process from 'node:process'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 数据库连接测试
export async function testConnection() {
  try {
    await prisma.$connect()
    return { success: true, message: '数据库连接成功' }
  } catch (error) {
    return { success: false, message: `数据库连接失败: ${error.message}` }
  }
}

// 分页查询工具
export function createPagination(page = 1, limit = 10) {
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

// 查询结果包装
export function createPaginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// 错误处理
export function handleDatabaseError(error) {
  console.error('数据库错误:', error)
  
  if (error.code === 'P2002') {
    return withDevDetail({ success: false, message: '数据已存在，请检查唯一字段' }, error)
  }
  
  if (error.code === 'P2025') {
    return withDevDetail({ success: false, message: '记录不存在' }, error)
  }
  
  return withDevDetail({ success: false, message: '数据库操作失败' }, error)
} 

function withDevDetail(base, error) {
  if (process.env.NODE_ENV !== 'production') {
    return {
      ...base,
      code: error.code || 'UNKNOWN',
      detail: error.message || String(error)
    }
  }
  return base
}