# 指纹检测后台管理系统

一个基于 Next.js 15 + PostgreSQL + Prisma 的现代化指纹检测后台管理系统。

## 🚀 特性

- **现代化技术栈**: Next.js 15 + React 19 + Tailwind CSS
- **高性能数据库**: PostgreSQL + Prisma ORM
- **缓存系统**: Redis 缓存支持
- **安全认证**: JWT 认证 + 角色权限控制
- **文件上传**: 支持图片上传和管理
- **实时统计**: 数据统计和图表展示
- **响应式设计**: 支持桌面和移动端
- **API 限流**: 防止恶意请求
- **操作日志**: 完整的操作审计

## 📋 功能模块

### 用户管理
- 用户信息管理
- 用户状态控制
- 用户行为分析

### 检测记录
- 指纹检测记录
- 检测结果管理
- 检测统计分析

### 内容管理
- 轮播图管理
- 新闻资讯管理
- 系统公告

### 反馈系统
- 用户反馈管理
- 反馈分类处理
- 自动回复模板

### 优惠券系统
- 优惠券创建和管理
- 用户优惠券分配
- 使用情况统计

### 系统管理
- 管理员账户管理
- 系统配置管理
- 操作日志查看

## 🛠️ 技术栈

### 前端
- **Next.js 15**: React 框架
- **React 19**: UI 库
- **Tailwind CSS**: 样式框架
- **TypeScript**: 类型安全

### 后端
- **Next.js API Routes**: 后端 API
- **Prisma**: ORM 框架
- **PostgreSQL**: 主数据库
- **Redis**: 缓存数据库
- **JWT**: 身份认证

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Prisma Studio**: 数据库管理

## 📦 安装和运行

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### 1. 克隆项目
```bash
git clone <repository-url>
cd finger-detect-backend
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量文件
cp env.example .env

# 编辑环境变量
vim .env
```

### 4. 数据库设置
```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 初始化数据库数据
npm run db:init
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库相关命令
npm run db:generate    # 生成 Prisma 客户端
npm run db:migrate     # 运行迁移
npm run db:deploy      # 部署迁移
npm run db:reset       # 重置数据库
npm run db:studio      # 打开 Prisma Studio
npm run db:init        # 初始化数据

# 一键设置
npm run setup          # 生成客户端 + 迁移 + 初始化
```

## 📊 API 文档

### 认证相关
- `POST /api/auth/login` - 管理员登录

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/[id]` - 获取用户详情
- `PUT /api/users/[id]` - 更新用户信息
- `DELETE /api/users/[id]` - 删除用户

### 检测记录
- `GET /api/detections` - 获取检测记录
- `POST /api/detections` - 创建检测记录

### 内容管理
- `GET /api/banners` - 获取轮播图
- `POST /api/banners` - 创建轮播图
- `GET /api/news` - 获取新闻列表
- `POST /api/news` - 创建新闻

### 反馈管理
- `GET /api/feedbacks` - 获取反馈列表
- `POST /api/feedbacks` - 提交反馈

### 优惠券管理
- `GET /api/coupons` - 获取优惠券列表
- `POST /api/coupons` - 创建优惠券

### 系统管理
- `GET /api/health` - 健康检查
- `GET /api/stats` - 统计数据
- `POST /api/upload` - 文件上传

## 🏗️ 项目结构

```
finger-detect-backend/
├── prisma/                 # 数据库模型和迁移
│   └── schema.prisma      # Prisma 模型定义
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API 路由
│   │   ├── dashboard/     # 仪表盘页面
│   │   ├── users/         # 用户管理页面
│   │   └── ...            # 其他页面
│   ├── components/        # React 组件
│   │   └── layout/        # 布局组件
│   └── lib/               # 工具库
│       ├── db.js          # 数据库连接
│       ├── redis.js       # Redis 连接
│       └── middleware.js  # 中间件
├── public/                # 静态文件
├── scripts/               # 脚本文件
├── docs/                  # 文档
└── env.example            # 环境变量示例
```

## 🔒 安全特性

- **JWT 认证**: 安全的身份验证
- **角色权限**: 基于角色的访问控制
- **API 限流**: 防止恶意请求
- **输入验证**: 数据验证和清理
- **SQL 注入防护**: ORM 自动防护
- **文件安全**: 安全的文件上传

## 📈 性能优化

- **数据库优化**: 索引和查询优化
- **缓存策略**: Redis 缓存热点数据
- **代码分割**: 按需加载
- **图片优化**: 自动图片优化
- **CDN 支持**: 静态资源加速

## 🚀 部署

### 环境变量配置
```bash
# 数据库
DATABASE_URL="postgresql://username:password@host:5432/database"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"

# 其他配置
NODE_ENV="production"
```

### 部署步骤
1. 构建项目: `npm run build`
2. 运行迁移: `npm run db:deploy`
3. 启动服务: `npm start`

## 🤝 贡献

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您有任何问题或建议，请：

- 创建 [Issue](https://github.com/your-repo/issues)
- 发送邮件到: support@fingerdetect.com
- 加入我们的微信群

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础功能实现
- 用户管理和检测记录
- 内容管理系统

---

**注意**: 这是一个开发中的项目，请在生产环境使用前进行充分测试。
