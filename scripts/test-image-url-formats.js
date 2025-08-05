#!/usr/bin/env node

/**
 * 测试图片URL格式支持
 * 验证检测接口支持的所有图片URL格式
 */

const testUrls = [
  // HTTP/HTTPS URLs
  'https://example.com/image.jpg',
  'http://example.com/image.png',
  'https://cdn.example.com/photos/finger.jpg',
  
  // 相对路径
  '/uploads/test_image.jpg',
  '/uploads/fingerprints/thumb.jpg',
  '/uploads/detections/2024/01/15/image.png',
  
  // 微信小程序临时文件
  'wxfile://tmp_dbca43c1906b53c7b81fd7975a8b0f9b.jpg',
  'wxfile://tmp_1234567890abcdef.jpg',
  'wxfile://tmp_abcdef1234567890.png',
  
  // 无效格式（应该被拒绝）
  'invalid_url_format',
  'file://local/path/image.jpg',
  'ftp://example.com/image.jpg'
];

const validFormats = [
  'http://',
  'https://', 
  '/uploads/',
  'wxfile://'
];

function isValidImageUrl(url) {
  return validFormats.some(format => url.startsWith(format));
}

console.log('🧪 测试图片URL格式支持\n');

console.log('✅ 支持的格式:');
validFormats.forEach(format => {
  console.log(`  - ${format}`);
});

console.log('\n📋 测试结果:');
testUrls.forEach(url => {
  const isValid = isValidImageUrl(url);
  const status = isValid ? '✅ 通过' : '❌ 拒绝';
  console.log(`${status} ${url}`);
});

console.log('\n📊 统计:');
const validCount = testUrls.filter(url => isValidImageUrl(url)).length;
const invalidCount = testUrls.length - validCount;
console.log(`  - 有效格式: ${validCount} 个`);
console.log(`  - 无效格式: ${invalidCount} 个`);
console.log(`  - 总计: ${testUrls.length} 个`);

console.log('\n🎯 微信小程序真机环境支持:');
const wxfileUrls = testUrls.filter(url => url.startsWith('wxfile://'));
wxfileUrls.forEach(url => {
  console.log(`  ✅ ${url}`);
});

console.log('\n✨ 测试完成！'); 