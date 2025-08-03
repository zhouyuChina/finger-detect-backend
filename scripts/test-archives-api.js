const { PrismaClient } = require('../src/generated/prisma/index.js')

const prisma = new PrismaClient()

async function testArchivesApi() {
  try {
    console.log('🧪 开始测试档案接口...')

    // 1. 获取第一个微信用户和子用户作为测试数据
    const testWechatUser = await prisma.wechatUser.findFirst({
      include: {
        subUsers: true
      }
    })

    if (!testWechatUser || testWechatUser.subUsers.length === 0) {
      console.log('❌ 没有找到测试用的微信用户或子用户')
      return
    }

    const testSubUser = testWechatUser.subUsers[0]
    console.log(`📋 使用测试微信用户: ${testWechatUser.nickname} (${testWechatUser.openid})`)
    console.log(`📋 使用测试子用户: ${testSubUser.realName} (${testSubUser.username})`)

    // 2. 模拟 GET 请求 - 获取档案列表
    console.log('\n1. 测试获取档案列表 (GET /api/miniprogram/archives?username=xxx):')
    
    // 模拟认证中间件的行为
    const mockRequest = {
      user: {
        id: testWechatUser.id,
        openid: testWechatUser.openid,
        nickname: testWechatUser.nickname
      }
    }

    // 模拟查询参数
    const username = testSubUser.username
    const page = 1
    const limit = 10

    // 1. 首先根据openid和用户名找到对应的子用户
    const subUser = await prisma.subUser.findFirst({
      where: {
        wechatUserId: mockRequest.user.id,
        username: username,
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        realName: true
      }
    })

    if (!subUser) {
      console.log('❌ 子用户不存在')
      return
    }

    console.log('✅ 找到子用户:', subUser.realName)

    // 2. 计算分页参数
    const skip = (page - 1) * limit

    // 3. 查询该子用户的档案列表
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where: {
          subUserId: subUser.id
        },
        select: {
          id: true,
          archiveName: true,
          activity: true,
          photoCount: true,
          bodyPart: true,
          detectionTime: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.archive.count({
        where: {
          subUserId: subUser.id
        }
      })
    ])

    console.log('✅ 获取档案列表成功，数量:', archives.length)
    console.log('📊 档案统计:')
    archives.forEach((archive, index) => {
      console.log(`  ${index + 1}. ${archive.archiveName}`)
      console.log(`     活跃度: ${archive.activity}`)
      console.log(`     照片数: ${archive.photoCount}`)
      console.log(`     检测部位: ${archive.bodyPart}`)
      console.log(`     创建时间: ${archive.createdAt}`)
    })

    // 4. 构建响应数据
    const responseData = {
      subUser: {
        id: subUser.id,
        username: subUser.username,
        realName: subUser.realName
      },
      archives: archives.map(archive => ({
        id: archive.id,
        archiveName: archive.archiveName,
        activity: archive.activity,
        photoCount: archive.photoCount,
        bodyPart: archive.bodyPart,
        detectionTime: archive.detectionTime,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    console.log('📋 响应数据:')
    console.log(`- 子用户: ${responseData.subUser.realName}`)
    console.log(`- 档案数量: ${responseData.archives.length}`)
    console.log(`- 总数量: ${responseData.pagination.total}`)
    console.log(`- 总页数: ${responseData.pagination.totalPages}`)

    // 3. 测试创建新档案
    console.log('\n2. 测试创建新档案 (POST /api/miniprogram/archives):')
    
    const newArchiveData = {
      username: testSubUser.username,
      archiveName: `测试档案${Date.now()}`,
      bodyPart: 'fingerprint',
      activity: 'high',
      photoCount: 5
    }

    // 检查档案名称是否已存在
    const existingArchive = await prisma.archive.findFirst({
      where: {
        subUserId: subUser.id,
        archiveName: newArchiveData.archiveName
      }
    })

    if (existingArchive) {
      console.log('⚠️ 档案名称已存在，跳过创建测试')
    } else {
      // 创建新档案
      const newArchive = await prisma.archive.create({
        data: {
          subUserId: subUser.id,
          archiveName: newArchiveData.archiveName,
          bodyPart: newArchiveData.bodyPart,
          activity: newArchiveData.activity,
          photoCount: newArchiveData.photoCount,
          detectionTime: new Date()
        },
        select: {
          id: true,
          subUserId: true,
          archiveName: true,
          bodyPart: true,
          activity: true,
          photoCount: true,
          detectionTime: true,
          createdAt: true,
          updatedAt: true
        }
      })

      console.log('✅ 新档案创建成功:')
      console.log(`- 档案名称: ${newArchive.archiveName}`)
      console.log(`- 检测部位: ${newArchive.bodyPart}`)
      console.log(`- 活跃度: ${newArchive.activity}`)
      console.log(`- 照片数: ${newArchive.photoCount}`)

      // 更新子用户的档案数量
      await prisma.subUser.update({
        where: { id: subUser.id },
        data: {
          archives: {
            increment: 1
          }
        }
      })

      console.log('✅ 子用户档案数量已更新')

      // 清理测试数据
      await prisma.archive.delete({
        where: { id: newArchive.id }
      })
      console.log('🧹 测试数据已清理')
    }

    console.log('\n✅ 档案接口测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testArchivesApi()
  .then(() => {
    console.log('✅ 测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试脚本执行失败:', error)
    process.exit(1)
  }) 