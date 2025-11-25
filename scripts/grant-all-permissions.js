import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

// 所有可用的路由权限
const ALL_PERMISSIONS = [
  '/dashboard',
  '/banners',
  '/news',
  '/user-ids',
  '/user-management',
  '/archives',
  '/detections',
  '/feedback',
  '/system-replies',
  '/coupons',
  '/analytics',
  '/company',
  '/settings'
]

async function main() {
  console.log('🔄 开始为现有管理员授予权限...\n')

  // 获取所有非超级管理员的管理员
  const admins = await prisma.admin.findMany({
    where: {
      role: {
        not: 'super_admin'
      }
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      permissions: true
    }
  })

  if (admins.length === 0) {
    console.log('✅ 没有需要更新的普通管理员账户\n')
    return
  }

  console.log(`找到 ${admins.length} 个普通管理员账户:\n`)

  for (const admin of admins) {
    const currentPermCount = admin.permissions?.length || 0
    console.log(`📝 ${admin.username} (${admin.name})`)
    console.log(`   当前权限数: ${currentPermCount}`)

    // 更新权限为所有权限
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        permissions: ALL_PERMISSIONS
      }
    })

    console.log(`   ✅ 已授予 ${ALL_PERMISSIONS.length} 个权限\n`)
  }

  console.log('✅ 权限授予完成！\n')
  console.log('已授予的权限列表:')
  ALL_PERMISSIONS.forEach(p => console.log(`  - ${p}`))
  console.log('\n💡 提示: 现在这些管理员可以访问所有菜单了。如需限制权限，请在"系统设置"->"管理员管理"中修改。')
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
