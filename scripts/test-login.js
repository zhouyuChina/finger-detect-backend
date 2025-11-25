import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  const testUsername = 'admin'
  const testPassword = 'admin123456'

  console.log('🔐 测试登录...')
  console.log(`用户名: ${testUsername}`)
  console.log(`密码: ${testPassword}\n`)

  // 查找管理员
  const admin = await prisma.admin.findUnique({
    where: { username: testUsername }
  })

  if (!admin) {
    console.log('❌ 用户不存在')
    return
  }

  console.log('✅ 找到用户:')
  console.log(`   ID: ${admin.id}`)
  console.log(`   用户名: ${admin.username}`)
  console.log(`   姓名: ${admin.name}`)
  console.log(`   角色: ${admin.role}`)
  console.log(`   状态: ${admin.isActive ? '激活' : '禁用'}`)
  console.log(`   邮箱: ${admin.email || '未设置'}\n`)

  // 验证密码
  const isPasswordValid = await bcrypt.compare(testPassword, admin.password)

  if (isPasswordValid) {
    console.log('✅ 密码验证成功!')
    console.log('\n登录凭据:')
    console.log(`   用户名: ${testUsername}`)
    console.log(`   密码: ${testPassword}`)
  } else {
    console.log('❌ 密码验证失败!')
    console.log('可能原因:')
    console.log('1. 密码不正确')
    console.log('2. 密码哈希值有问题')
    console.log('\n尝试重置密码...')

    const newHashedPassword = await bcrypt.hash(testPassword, 10)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: newHashedPassword }
    })

    console.log('✅ 密码已重置为: admin123456')
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
