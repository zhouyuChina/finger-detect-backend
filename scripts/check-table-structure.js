/**
 * 检查当前数据库表结构
 */
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function checkTableStructure() {
  try {
    // 检查 Detection 表的字段
    const result = await prisma.$queryRaw`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'detections'
      ORDER BY ordinal_position
    `

    console.log('📋 Detection 表结构：\n')
    console.table(result)

    // 检查是否有外键
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'detections'
    `

    console.log('\n🔗 外键约束：\n')
    if (foreignKeys.length > 0) {
      console.table(foreignKeys)
    } else {
      console.log('(无)')
    }

  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTableStructure()
