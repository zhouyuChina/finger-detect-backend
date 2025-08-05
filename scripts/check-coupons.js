const { PrismaClient } = require('../src/generated/prisma/index.js');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 检查优惠券数据...');
    
    // 查询优惠券
    const coupons = await prisma.coupon.findMany();
    console.log('📋 优惠券数量:', coupons.length);
    console.log('📋 优惠券列表:', JSON.stringify(coupons, null, 2));
    
    // 查询用户优惠券
    const userCoupons = await prisma.userCoupon.findMany();
    console.log('👤 用户优惠券数量:', userCoupons.length);
    console.log('👤 用户优惠券列表:', JSON.stringify(userCoupons, null, 2));
    
    // 查询子用户
    const subUsers = await prisma.subUser.findMany();
    console.log('👥 子用户数量:', subUsers.length);
    console.log('👥 子用户列表:', JSON.stringify(subUsers.map(u => ({ id: u.id, username: u.username, wechatUserId: u.wechatUserId })), null, 2));
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 