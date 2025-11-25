import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查超级管理员账户...\n')

  // 查找所有管理员
  const allAdmins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  })

  console.log(`📊 数据库中共有 ${allAdmins.length} 个管理员账户:\n`)

  if (allAdmins.length > 0) {
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. 用户名: ${admin.username}`)
      console.log(`   姓名: ${admin.name}`)
      console.log(`   角色: ${admin.role}`)
      console.log(`   状态: ${admin.isActive ? '激活' : '禁用'}`)
      console.log(`   邮箱: ${admin.email || '未设置'}`)
      console.log(`   创建时间: ${admin.createdAt}`)
      console.log('')
    })
  }

  // 查找超级管理员
  const superAdmin = await prisma.admin.findFirst({
    where: { role: 'super_admin' }
  })

  if (superAdmin) {
    console.log('✅ 已存在超级管理员账户:')
    console.log(`   用户名: ${superAdmin.username}`)
    console.log(`   姓名: ${superAdmin.name}`)
    console.log('\n⚠️  如果忘记密码,可以运行此脚本重置密码\n')

    // 可选: 重置密码
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question('是否要重置超级管理员密码? (y/n): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() === 'y') {
      const newPassword = 'admin123456'
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.admin.update({
        where: { id: superAdmin.id },
        data: { password: hashedPassword }
      })

      console.log('\n✅ 密码已重置!')
      console.log(`   用户名: ${superAdmin.username}`)
      console.log(`   新密码: ${newPassword}`)
      console.log('\n⚠️  请登录后立即修改密码!')
    }
  } else {
    console.log('❌ 未找到超级管理员账户，正在创建...\n')

    const defaultPassword = 'admin123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const newAdmin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '超级管理员',
        email: 'admin@example.com',
        role: 'super_admin',
        isActive: true
      }
    })

    console.log('✅ 超级管理员账户创建成功!')
    console.log(`   用户名: ${newAdmin.username}`)
    console.log(`   密码: ${defaultPassword}`)
    console.log(`   邮箱: ${newAdmin.email}`)
    console.log('\n⚠️  请登录后立即修改密码!')
  }
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
