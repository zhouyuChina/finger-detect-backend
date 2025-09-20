// 配置文件
const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 4000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },

  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    uploadPath: process.env.UPLOAD_PATH || '/uploads',
  },

  // 跨域配置
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4000', 'http://localhost:3001'],
  },

  // 第三方检测服务配置
  detectionService: {
    baseUrl: process.env.DETECTION_SERVICE_URL || 'http://localhost:11008',
    endpoint: process.env.DETECTION_SERVICE_ENDPOINT || '/predict',
    fullUrl: function() {
      return `${this.baseUrl}${this.endpoint}`;
    }
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 获取完整的服务器URL
  getServerUrl: function() {
    const protocol = this.server.nodeEnv === 'production' ? 'https' : 'http';
    return `${protocol}://${this.server.host}:${this.server.port}`;
  },

  // 获取完整的图片URL
  getImageUrl: function(imagePath) {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('wxfile://')) {
      return imagePath;
    }
    
    // 相对路径转换为完整URL
    return `${this.getServerUrl()}${imagePath}`;
  }
};

export default config;
