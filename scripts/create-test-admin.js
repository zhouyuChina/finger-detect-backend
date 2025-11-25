import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 创建测试管理员账户...\n')

  // 只授予部分权限用于测试
  const TEST_PERMISSIONS = [
    '/dashboard',
    '/banners',
    '/news'
  ]

  const username = 'test_admin'
  const password = '123456'
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // 先检查是否已存在
    const existing = await prisma.admin.findUnique({
      where: { username }
    })

    if (existing) {
      console.log('⚠️  测试账户已存在，先删除旧账户...')
      await prisma.admin.delete({
        where: { username }
      })
    }

    // 创建测试管理员
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name: '测试管理员',
        role: 'admin',
        permissions: TEST_PERMISSIONS,
        isActive: true
      }
    })

    console.log('✅ 测试管理员创建成功！\n')
    console.log('登录信息:')
    console.log(`  用户名: ${username}`)
    console.log(`  密码: ${password}`)
    console.log(`  角色: ${admin.role}`)
    console.log(`\n授予的权限 (只能访问这3个菜单):`)
    TEST_PERMISSIONS.forEach(p => console.log(`  ✓ ${p}`))
    console.log(`\n无法访问的菜单:`)
    const allRoutes = [
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
    allRoutes
      .filter(r => !TEST_PERMISSIONS.includes(r))
      .forEach(p => console.log(`  ✗ ${p}`))

    console.log('\n💡 请用此账户登录测试，应该只能看到：仪表盘、Banner管理、资讯管理 这3个菜单')

  } catch (error) {
    console.error('❌ 创建失败:', error.message)
  }
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
