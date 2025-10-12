# 部署指南

## Supabase 数据库配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并创建账号
2. 创建新项目
3. 记录以下信息：
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: `your-anon-key`
   - Service Role Key: `your-service-role-key`（保密！）

### 2. 运行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中依次执行以下SQL脚本：

#### 创建表结构

参考 `specs/001-description-netlify-bianca/data-model.md` 中的完整SQL脚本。

主要表：
- `users` - 用户表
- `wallets` - 钱包表
- `orders` - 订单表
- `transactions` - 成交记录表
- `wallet_transactions` - 钱包交易记录表
- `market_prices` - 市场行情表
- `security_logs` - 安全日志表

#### 启用 Row Level Security (RLS)

所有表都已配置 RLS 策略，确保数据安全：
- 用户只能访问自己的数据
- 市场行情数据公开可读
- 交易记录不可修改

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# API URLs (使用默认值)
COINGECKO_API_URL=https://api.coingecko.com/api/v3
BINANCE_API_URL=https://api.binance.com

# Environment
NODE_ENV=development
```

## Netlify 部署

### 方法 1: GitHub 自动部署（推荐）

1. 将代码推送到 GitHub
2. 登录 [Netlify](https://www.netlify.com/)
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - Build command: `pnpm run build`
   - Publish directory: `dist`
   - Base directory: (留空)

6. 添加环境变量：
   - 在 Site settings → Environment variables 中添加所有 `.env` 变量

7. 点击 "Deploy site"

### 方法 2: CLI 部署

1. 安装 Netlify CLI：
```bash
pnpm install -g netlify-cli
```

2. 登录：
```bash
netlify login
```

3. 初始化项目：
```bash
netlify init
```

4. 设置环境变量：
```bash
netlify env:set PUBLIC_SUPABASE_URL "your-value"
netlify env:set PUBLIC_SUPABASE_ANON_KEY "your-value"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-value"
```

5. 构建并部署：
```bash
pnpm run build
netlify deploy --prod
```

## 部署后验证

### 1. 测试基础功能

- [ ] 访问首页加载正常
- [ ] 用户注册流程
- [ ] 用户登录流程
- [ ] 市场行情数据加载
- [ ] API 端点响应正常

### 2. 测试 API 端点

```bash
# 测试市场行情
curl https://your-site.netlify.app/api/market/tickers

# 测试单个交易对
curl https://your-site.netlify.app/api/market/BTC-USDT
```

### 3. 检查日志

在 Netlify Dashboard 中：
- Functions → 查看 Serverless 函数日志
- Deploys → 查看构建日志

## 常见问题

### 问题 1: 环境变量未生效

**解决方案**：
- 检查变量名是否正确
- `PUBLIC_` 前缀的变量会暴露到客户端
- 重新部署以应用新的环境变量

### 问题 2: Supabase 连接失败

**解决方案**：
- 验证 URL 和 Key 是否正确
- 检查 Supabase 项目是否暂停
- 查看 Netlify Functions 日志

### 问题 3: 构建失败

**解决方案**：
```bash
# 本地测试构建
pnpm run build

# 检查 TypeScript 错误
pnpm run astro check

# 检查 Lint 错误
pnpm run lint
```

### 问题 4: 市场数据加载失败

**解决方案**：
- CoinGecko API 有速率限制（免费版50次/分钟）
- Binance API 可能在某些地区被限制
- 检查网络连接和 CORS 设置

## 性能优化

### 1. 启用缓存

市场行情 API 已配置缓存：
- `/api/market/tickers`: 10秒缓存
- `/api/market/orderbook/:pair`: 5秒缓存

### 2. CDN 配置

Netlify 自动使用 CDN，无需额外配置。

### 3. 资源优化

```bash
# 分析构建产物大小
pnpm run build
```

## 监控和维护

### 1. Supabase 监控

在 Supabase Dashboard 中监控：
- Database → 查看查询性能
- API → 查看 API 使用情况
- Auth → 查看用户活动

### 2. Netlify 监控

在 Netlify Dashboard 中监控：
- Analytics → 访问统计
- Functions → 函数调用次数和耗时
- Bandwidth → 流量使用

### 3. 错误追踪

建议集成：
- Sentry（错误监控）
- LogRocket（用户会话录制）
- Google Analytics（访问分析）

## 安全检查清单

- [ ] 所有环境变量已正确配置
- [ ] SUPABASE_SERVICE_ROLE_KEY 未暴露到客户端
- [ ] RLS 策略已启用并测试
- [ ] HTTPS 已启用（Netlify 自动）
- [ ] 安全头部已配置（见 `netlify.toml`）
- [ ] CORS 策略已正确设置
- [ ] 用户输入已验证和清理

## 回滚策略

### Netlify 快速回滚

1. 进入 Netlify Dashboard
2. Deploys → 选择历史部署
3. 点击 "Publish deploy" 恢复到该版本

### 数据库回滚

Supabase 提供自动备份：
1. Dashboard → Settings → Backups
2. 选择备份点进行恢复

## 支持

遇到问题？
- 查看项目文档：`specs/001-description-netlify-bianca/`
- 提交 Issue：[GitHub Issues](https://github.com/your-repo/issues)
- 查看日志：Netlify Dashboard → Functions

