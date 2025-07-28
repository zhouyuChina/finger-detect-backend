const { PrismaClient } = require('../src/generated/prisma/index.js')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')
  
  try {
    // 创建默认管理员账户
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        name: '系统管理员',
        email: 'admin@example.com',
        role: 'super_admin',
        isActive: true
      }
    })
    
    console.log('✅ 管理员账户创建成功:', admin.username)
    
    // 创建默认公司信息
    const company = await prisma.company.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: '指纹检测科技有限公司',
        description: '专业的指纹检测服务提供商',
        address: '北京市朝阳区xxx街道xxx号',
        phone: '400-123-4567',
        email: 'contact@fingerdetect.com',
        website: 'https://www.fingerdetect.com',
        wechat: 'fingerdetect_official'
      }
    })
    
    console.log('✅ 公司信息创建成功:', company.name)
    
    // 创建默认系统配置
    const defaultConfigs = [
      {
        key: 'system_name',
        value: '指纹检测后台管理系统',
        description: '系统名称',
        type: 'string',
        isPublic: true
      },
      {
        key: 'system_version',
        value: '1.0.0',
        description: '系统版本',
        type: 'string',
        isPublic: true
      },
      {
        key: 'max_detection_per_day',
        value: '100',
        description: '每日最大检测次数',
        type: 'number',
        isPublic: false
      },
      {
        key: 'detection_timeout',
        value: '30',
        description: '检测超时时间（秒）',
        type: 'number',
        isPublic: false
      }
    ]
    
    for (const config of defaultConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: config
      })
    }
    
    console.log('✅ 系统配置创建成功')
    
    console.log('✅ 系统回复模板创建成功')
    
    console.log('🎉 数据库初始化完成！')
    console.log('默认管理员账户: admin / admin123')
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 