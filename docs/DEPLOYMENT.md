# 部署指南

## 部署到 Vercel（推荐）

### 1. 准备工作

1. **注册 Vercel 账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **准备数据库**
   - 推荐使用 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) 作为 PostgreSQL 数据库
   - 获取数据库连接字符串

### 2. 部署步骤

1. **连接 GitHub 仓库**
   ```bash
   # 确保代码已提交到 GitHub
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 登录 Vercel
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   DATABASE_URL=你的数据库连接字符串
   JWT_SECRET=你的JWT密钥（可以是任意字符串）
   ```

4. **部署**
   - Vercel 会自动检测到 Next.js 项目
   - 点击 "Deploy" 开始部署

### 3. 部署后配置

1. **初始化数据库**
   ```bash
   # 在 Vercel 的 Functions 中运行
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **添加测试数据**
   ```bash
   # 如果需要，可以运行种子脚本
   node scripts/seed-users.js
   node scripts/seed-news.js
   # ... 其他种子脚本
   ```

## 部署到其他平台

### Railway
- 类似 Vercel，支持 PostgreSQL
- 自动部署，配置简单

### Render
- 支持 Next.js 和 PostgreSQL
- 免费额度有限

### 自建服务器
- 需要配置 Nginx
- 需要安装 PostgreSQL
- 需要配置 SSL 证书

## 注意事项

1. **数据库连接**
   - 确保数据库可以从外部访问
   - 使用 SSL 连接（生产环境）

2. **环境变量**
   - 不要将敏感信息提交到代码仓库
   - 使用环境变量管理配置

3. **文件上传**
   - 生产环境建议使用云存储（如 AWS S3）
   - 本地文件上传在 Vercel 中会被重置

4. **性能优化**
   - 启用 Next.js 缓存
   - 优化图片加载
   - 使用 CDN

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确保所有依赖都已安装

2. **数据库连接失败**
   - 检查 DATABASE_URL 格式
   - 确认数据库服务状态

3. **API 路由 404**
   - 检查文件路径是否正确
   - 确认 Next.js 配置

### 获取帮助

- 查看 Vercel 部署日志
- 检查浏览器控制台错误
- 查看服务器日志 