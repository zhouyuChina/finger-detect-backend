// 测试删除微信用户
const testId = 'cmhpl9q8v0000s6slk02rvevf'  // 微信用户 ID
const url = `http://localhost:4000/api/user-ids/${testId}`

console.log('🧪 测试删除微信用户及所有关联数据')
console.log('URL:', url)
console.log('方法: DELETE')
console.log('')

fetch(url, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(async res => {
    console.log('状态码:', res.status)
    const text = await res.text()
    console.log('\n响应内容:')
    try {
      const data = JSON.parse(text)
      console.log(JSON.stringify(data, null, 2))
    } catch {
      console.log(text.substring(0, 500))
    }
  })
  .catch(err => {
    console.error('请求失败:', err.message)
  })
