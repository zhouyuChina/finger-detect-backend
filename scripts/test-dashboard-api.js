// 测试仪表盘 API 返回的数据
async function testDashboard() {
  try {
    const response = await fetch('http://localhost:4000/api/dashboard/stats')
    const result = await response.json()

    console.log('📊 仪表盘统计数据:\n')
    console.log('✅ 请求成功:', result.success)

    if (result.success) {
      const { wechatUserCount, subUserCount, archiveCount, genderData, ageData } = result.data

      console.log(`\n📈 统计数据:`)
      console.log(`  微信用户数: ${wechatUserCount}`)
      console.log(`  用户数量: ${subUserCount}`)
      console.log(`  档案数量: ${archiveCount}`)

      console.log(`\n👥 性别分布:`)
      if (genderData && genderData.length > 0) {
        genderData.forEach(item => {
          const total = genderData.reduce((sum, d) => sum + d.value, 0)
          const percentage = ((item.value / total) * 100).toFixed(1)
          console.log(`  ${item.name}: ${item.value} (${percentage}%)`)
        })
      } else {
        console.log('  暂无数据')
      }

      console.log(`\n📅 年龄分布:`)
      if (ageData && ageData.length > 0) {
        ageData.forEach(item => {
          const total = ageData.reduce((sum, d) => sum + d.value, 0)
          const percentage = ((item.value / total) * 100).toFixed(1)
          console.log(`  ${item.name}: ${item.value} (${percentage}%)`)
        })
      } else {
        console.log('  暂无数据')
      }
    } else {
      console.log('❌ 错误:', result.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

testDashboard()
