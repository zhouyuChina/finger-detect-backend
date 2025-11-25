import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 调试管理员权限系统...\n')

  // 获取所有管理员及其权限
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      permissions: true,
      isActive: true
    }
  })

  console.log('📋 数据库中的管理员列表:\n')
  admins.forEach(admin => {
    console.log(`用户名: ${admin.username}`)
    console.log(`姓名: ${admin.name}`)
    console.log(`角色: ${admin.role}`)
    console.log(`状态: ${admin.isActive ? '激活' : '禁用'}`)
    console.log(`权限数量: ${admin.permissions?.length || 0}`)
    if (admin.permissions && admin.permissions.length > 0) {
      console.log(`权限列表:`)
      admin.permissions.forEach(p => console.log(`  - ${p}`))
    } else {
      console.log(`⚠️  该管理员没有任何权限`)
    }
    console.log('---')
  })

  console.log('\n💡 提示:')
  console.log('1. 超级管理员(super_admin)会自动拥有所有权限，无需在数据库中设置')
  console.log('2. 普通管理员(admin)必须在数据库中设置具体权限才能访问对应菜单')
  console.log('3. 如果普通管理员的 permissions 数组为空，将无法访问任何菜单\n')

  console.log('可用的路由权限列表:')
  const availableRoutes = [
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
  availableRoutes.forEach(route => console.log(`  - ${route}`))
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
