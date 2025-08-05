// 微信小程序优惠券功能使用示例

// 配置
const API_BASE_URL = 'https://your-domain.com/api/miniprogram';
let authToken = '';

// 获取认证token
async function getAuthToken() {
  try {
    const loginResult = await wx.login();
    const response = await wx.request({
      url: `${API_BASE_URL}/auth`,
      method: 'POST',
      data: {
        code: loginResult.code
      }
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      return authToken;
    }
  } catch (error) {
    console.error('获取认证token失败:', error);
  }
  return null;
}

// 获取用户优惠券列表
async function getUserCoupons(page = 1, pageSize = 10, status = '') {
  try {
    const response = await wx.request({
      url: `${API_BASE_URL}/coupons`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        page,
        pageSize,
        status
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
  }
  return null;
}

// 获取未使用的优惠券
async function getUnusedCoupons(page = 1, pageSize = 10) {
  return await getUserCoupons(page, pageSize, 'unused');
}

// 获取已使用的优惠券
async function getUsedCoupons(page = 1, pageSize = 10) {
  return await getUserCoupons(page, pageSize, 'used');
}

// 获取已过期的优惠券
async function getExpiredCoupons(page = 1, pageSize = 10) {
  return await getUserCoupons(page, pageSize, 'expired');
}

// 页面示例：优惠券列表页面
Page({
  data: {
    coupons: [],
    loading: false,
    currentStatus: 'unused', // unused, used, expired
    currentPage: 1,
    hasMore: true
  },

  onLoad() {
    this.initAuth();
  },

  onShow() {
    this.loadCoupons();
  },

  // 初始化认证
  async initAuth() {
    const token = await getAuthToken();
    if (token) {
      this.loadCoupons();
    } else {
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      });
    }
  },

  // 加载优惠券
  async loadCoupons(refresh = false) {
    if (refresh) {
      this.setData({ currentPage: 1, hasMore: true });
    }
    
    if (!this.data.hasMore && !refresh) return;
    
    this.setData({ loading: true });
    
    try {
      const result = await getUserCoupons(
        this.data.currentPage, 
        20, 
        this.data.currentStatus
      );
      
      if (result) {
        const newCoupons = result.data || [];
        const allCoupons = refresh ? newCoupons : [...this.data.coupons, ...newCoupons];
        
        this.setData({ 
          coupons: allCoupons,
          loading: false,
          hasMore: newCoupons.length === 20,
          currentPage: this.data.currentPage + 1
        });
      }
    } catch (error) {
      console.error('加载优惠券失败:', error);
      this.setData({ loading: false });
    }
  },

  // 切换状态
  switchStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ currentStatus: status });
    this.loadCoupons(true); // 刷新数据
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoupons(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCoupons();
    }
  },

  // 查看优惠券详情
  viewCouponDetail(e) {
    const coupon = e.currentTarget.dataset.coupon;
    // 这里可以跳转到详情页面或显示详情弹窗
    wx.showModal({
      title: coupon.coupon.name,
      content: `类型: ${formatCouponType(coupon.coupon.type)}\n优惠值: ${coupon.coupon.value}\n有效期: ${formatTime(coupon.coupon.endTime)}\n状态: ${formatCouponStatus(coupon.status)}`,
      showCancel: false
    });
  }
});

// 工具函数：格式化优惠券状态
function formatCouponStatus(status) {
  const statusMap = {
    'unused': '未使用',
    'used': '已使用',
    'expired': '已过期'
  };
  return statusMap[status] || status;
}

// 工具函数：格式化优惠券类型
function formatCouponType(type) {
  const typeMap = {
    'discount': '满减券',
    'free': '免费券'
  };
  return typeMap[type] || type;
}

// 工具函数：格式化时间
function formatTime(timeStr) {
  const date = new Date(timeStr);
  return date.toLocaleDateString('zh-CN');
}

// 工具函数：计算剩余天数
function getRemainingDays(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// 工具函数：获取状态颜色
function getStatusColor(status) {
  const colorMap = {
    'unused': '#52c41a',
    'used': '#999999',
    'expired': '#ff4d4f'
  };
  return colorMap[status] || '#999999';
}

module.exports = {
  getAuthToken,
  getUserCoupons,
  getUnusedCoupons,
  getUsedCoupons,
  getExpiredCoupons,
  formatCouponStatus,
  formatCouponType,
  formatTime,
  getRemainingDays,
  getStatusColor
}; 