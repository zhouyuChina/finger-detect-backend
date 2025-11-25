import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 1. 微信用户数（ID的数量）- 从 wechat_user_verifications 表获取
    const wechatUserCount = await prisma.wechatUserVerification.count()

    // 2. 用户数量 - 从 sub_users 表获取
    const subUserCount = await prisma.subUser.count()

    // 3. 档案数量 - 从 archives 表获取
    const archiveCount = await prisma.archive.count()

    // 4. 用户性别比例 - 从 sub_users 表获取
    const genderStats = await prisma.subUser.groupBy({
      by: ['gender'],
      _count: {
        gender: true
      }
    })

    // 格式化性别数据 - 兼容多种格式
    const genderData = genderStats.map(item => {
      let name = '未知'
      const gender = item.gender

      // 判断性别 - 兼容多种格式（英文、中文、数字）
      if (gender === 'male' || gender === '男' || gender === '1' || gender === 1) {
        name = '男'
      } else if (gender === 'female' || gender === '女' || gender === '2' || gender === 2) {
        name = '女'
      }

      return {
        name,
        value: item._count.gender
      }
    }).filter(item => item.value > 0) // 过滤掉数量为0的项

    // 5. 年龄结构比例 - 从 sub_users 表获取
    const users = await prisma.subUser.findMany({
      select: {
        age: true
      }
    })

    // 按年龄段分组
    const ageGroups = {
      '18岁以下': 0,
      '18-30岁': 0,
      '31-40岁': 0,
      '41-50岁': 0,
      '51-60岁': 0,
      '60岁以上': 0,
      '未知': 0
    }

    users.forEach(user => {
      if (!user.age) {
        ageGroups['未知']++
      } else if (user.age < 18) {
        ageGroups['18岁以下']++
      } else if (user.age >= 18 && user.age <= 30) {
        ageGroups['18-30岁']++
      } else if (user.age >= 31 && user.age <= 40) {
        ageGroups['31-40岁']++
      } else if (user.age >= 41 && user.age <= 50) {
        ageGroups['41-50岁']++
      } else if (user.age >= 51 && user.age <= 60) {
        ageGroups['51-60岁']++
      } else {
        ageGroups['60岁以上']++
      }
    })

    // 格式化年龄数据
    const ageData = Object.entries(ageGroups)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0) // 只显示有数据的年龄段

    return NextResponse.json({
      success: true,
      data: {
        wechatUserCount,
        subUserCount,
        archiveCount,
        genderData,
        ageData
      }
    })
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
    return NextResponse.json({
      success: false,
      message: '获取统计数据失败'
    }, { status: 500 })
  }
}
