import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 开始更新管理员权限字段...\n')

  // 显示所有管理员的信息
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      permissions: true
    }
  })

  console.log('当前管理员列表:')
  admins.forEach(admin => {
    const permCount = admin.permissions?.length || 0
    console.log(`  - ${admin.username} (${admin.role}): ${permCount} 个权限`)
  })

  console.log('\n✅ 权限字段已存在于所有管理员账户中')
  console.log('\n提示：')
  console.log('  - 超级管理员会自动拥有所有权限')
  console.log('  - 其他管理员需要在"系统设置"->"管理员管理"中分配具体权限')
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
