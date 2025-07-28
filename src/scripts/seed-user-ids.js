const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()

async function seedUserIds() {
  try {
    console.log('开始创建ID管理模拟数据...')

    // 获取所有用户
    const users = await prisma.user.findMany()
    
    if (users.length === 0) {
      console.log('没有找到用户，请先创建用户数据')
      return
    }

    const realNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
    const idNumbers = [
      '110101199001011234',
      '110101199002022345',
      '110101199003033456',
      '110101199004044567',
      '110101199005055678',
      '110101199006066789',
      '110101199007077890',
      '110101199008088901',
      '110101199009099012',
      '110101199010100123'
    ]
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆']
    const statuses = ['active', 'inactive', 'pending']
    const genders = ['男', '女']
    const userTypes = ['普通用户', 'VIP用户', '企业用户']
    const verifyStatuses = ['pending', 'verified', 'rejected']
    const rejectReasons = [
      '身份证照片不清晰',
      '身份证信息与真实姓名不符',
      '身份证已过期',
      '照片中身份证信息模糊',
      '需要重新上传清晰照片'
    ]

    // 为每个用户创建ID记录
    for (let i = 0; i < Math.min(users.length, 20); i++) {
      const user = users[i]
      const realName = realNames[i % realNames.length]
      const idNumber = idNumbers[i % idNumbers.length]
      const age = 20 + (i % 50)
      const gender = genders[i % genders.length]
      const address = `${cities[i % cities.length]}市`
      const identity = userTypes[i % userTypes.length]
      const status = statuses[i % statuses.length]
      const subUsers = (i * 3) % 10
      const archives = (i * 5) % 20
      const photos = (i * 7) % 50
      const reports = (i * 11) % 15
      const unreadMessages = (i * 13) % 20
      const verifyStatus = verifyStatuses[i % verifyStatuses.length]
      
      // 检查是否已存在ID记录
      const existingId = await prisma.userId.findUnique({
        where: { userId: user.id }
      })

      if (existingId) {
        console.log(`用户 ${user.nickname || user.id} 已存在ID记录，跳过`)
        continue
      }

      // 创建ID记录
      const userIdData = {
        userId: user.id,
        idNumber: idNumber,
        realName: realName,
        age: age,
        gender: gender,
        address: address,
        identity: identity,
        status: status,
        subUsers: subUsers,
        archives: archives,
        photos: photos,
        reports: reports,
        unreadMessages: unreadMessages,
        idCardFront: `/uploads/id-cards/front-${i + 1}.jpg`,
        idCardBack: `/uploads/id-cards/back-${i + 1}.jpg`,
        idCardHand: `/uploads/id-cards/hand-${i + 1}.jpg`,
        verifyStatus: verifyStatus,
        verifyTime: verifyStatus !== 'pending' ? new Date() : null,
        rejectReason: verifyStatus === 'rejected' ? rejectReasons[i % rejectReasons.length] : null,
        verifyAdminId: null // 暂时不设置审核管理员
      }

      await prisma.userId.create({
        data: userIdData
      })

      console.log(`已创建用户 ${user.nickname || user.id} 的ID记录`)
    }

    console.log('ID管理模拟数据创建完成！')
  } catch (error) {
    console.error('创建ID管理模拟数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedUserIds()
}

module.exports = { seedUserIds } 