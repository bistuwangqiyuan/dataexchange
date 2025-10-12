# 加密货币交易平台 - 完整部署指南

**项目**: DataExchange Crypto Trading Platform  
**最后更新**: 2025-10-12  
**部署平台**: Netlify + Supabase

---

## 📋 目录

1. [前置准备](#前置准备)
2. [Supabase 配置](#supabase-配置)
3. [Netlify 配置](#netlify-配置)
4. [环境变量设置](#环境变量设置)
5. [数据库迁移](#数据库迁移)
6. [部署流程](#部署流程)
7. [验证测试](#验证测试)
8. [故障排查](#故障排查)

---

## 前置准备

### 所需账号

1. **GitHub 账号** (必须)
   - 用于代码托管和版本控制
   - [注册地址](https://github.com/signup)

2. **Supabase 账号** (必须)
   - 用于数据库和认证服务
   - [注册地址](https://supabase.com)

3. **Netlify 账号** (必须)
   - 用于网站部署和托管
   - [注册地址](https://app.netlify.com/signup)

### 本地环境

- ✅ Node.js >= 18
- ✅ pnpm >= 8
- ✅ Git
- ✅ 代码编辑器 (VS Code 推荐)

---

## Supabase 配置

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `dataexchange` (或您的项目名)
   - **Database Password**: 设置一个强密码并保存
   - **Region**: 选择离您用户最近的区域
4. 等待项目创建完成（约 2 分钟）

### 步骤 2: 获取 API 密钥

1. 在项目 Dashboard 中，点击左侧菜单的 "Settings" → "API"
2. 记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (需要点击 "Reveal" 显示)

⚠️ **重要**: Service Role key 拥有完全权限，**绝不**要在客户端使用或公开！

### 步骤 3: 配置邮箱验证（可选）

如果不需要强制邮箱验证（开发环境建议关闭）：

1. 点击左侧菜单 "Authentication" → "Settings"
2. 找到 "Email Auth" 部分
3. 关闭 "Confirm email" 选项
4. 点击 "Save"

---

## 数据库迁移

### 方法 1: 使用 Supabase SQL Editor (推荐)

1. 在 Supabase Dashboard，点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 打开项目中的 `database/migrations/001_initial_schema.sql` 文件
4. 复制全部内容并粘贴到 SQL Editor
5. 点击 "Run" 执行 SQL
6. 确认所有表和策略创建成功

### 方法 2: 使用 Supabase CLI (高级)

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref YOUR_PROJECT_REF

# 运行迁移
supabase db push
```

### 验证数据库迁移

1. 点击左侧 "Table Editor"
2. 确认以下表已创建：
   - ✅ `users`
   - ✅ `wallets`
   - ✅ `orders`
   - ✅ `transactions`
   - ✅ `wallet_transactions`
   - ✅ `market_prices`
   - ✅ `security_logs`

### 初始化市场数据（可选）

SQL Editor 中运行：

```sql
-- 插入初始市场价格数据（如果迁移脚本未包含）
INSERT INTO market_prices (trading_pair, price, volume_24h, change_24h, high_24h, low_24h) VALUES
('BTC/USDT', '45000.00', '1000000000', '0.025', '46000.00', '44000.00'),
('ETH/USDT', '3000.00', '500000000', '0.015', '3100.00', '2950.00'),
('BNB/USDT', '350.00', '100000000', '0.012', '360.00', '345.00'),
('SOL/USDT', '100.00', '50000000', '0.020', '105.00', '98.00')
ON CONFLICT (trading_pair) DO UPDATE SET
  price = EXCLUDED.price,
  updated_at = NOW();
```

---

## Netlify 配置

### 步骤 1: 从 GitHub 导入项目

1. 访问 [Netlify Dashboard](https://app.netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择 "GitHub"
4. 授权 Netlify 访问您的 GitHub 账户
5. 选择 `dataexchange` 仓库
6. 配置构建设置：
   - **Branch to deploy**: `001-description-netlify-bianca` (或 `main`)
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
7. **暂时不要点击 "Deploy"**，先配置环境变量

### 步骤 2: 配置站点名称（可选）

1. 在站点设置中，点击 "Site configuration" → "General"
2. 点击 "Change site name"
3. 输入您想要的站点名称（如 `mycrypto-exchange`）
4. 您的网站将可以通过 `https://mycrypto-exchange.netlify.app` 访问

---

## 环境变量设置

### 在 Netlify 中配置环境变量

1. 在 Netlify 站点设置中，点击 "Site configuration" → "Environment variables"
2. 点击 "Add a variable" 添加以下变量：

#### 必需的环境变量

| 变量名 | 值 | 来源 |
|--------|-----|------|
| `PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase API Settings |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase API Settings (Anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase API Settings (Service Role key) |

#### 可选的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PUBLIC_SITE_URL` | `https://your-site.netlify.app` | 网站 URL（用于邮件链接） |
| `NODE_VERSION` | `18` | Node.js 版本 |

### 配置步骤详解

**配置 PUBLIC_SUPABASE_URL**:
1. 点击 "Add a variable"
2. **Key**: `PUBLIC_SUPABASE_URL`
3. **Value**: 粘贴您的 Supabase Project URL
4. **Scopes**: 勾选 "All deployments"
5. 点击 "Create variable"

**配置 PUBLIC_SUPABASE_ANON_KEY**:
1. 点击 "Add a variable"
2. **Key**: `PUBLIC_SUPABASE_ANON_KEY`
3. **Value**: 粘贴您的 Supabase Anon key
4. **Scopes**: 勾选 "All deployments"
5. 点击 "Create variable"

**配置 SUPABASE_SERVICE_ROLE_KEY**:
1. 点击 "Add a variable"
2. **Key**: `SUPABASE_SERVICE_ROLE_KEY`
3. **Value**: 粘贴您的 Supabase Service Role key
4. **Scopes**: 勾选 "All deployments"
5. **⚠️ 重要**: 勾选 "Secret" 选项以隐藏敏感信息
6. 点击 "Create variable"

---

## 部署流程

### 方法 1: 通过 Netlify Dashboard 部署（推荐）

1. 在 Netlify 站点设置页面
2. 点击 "Deploys" 标签
3. 点击 "Trigger deploy" → "Deploy site"
4. 等待构建完成（通常 2-5 分钟）
5. 构建成功后，点击站点 URL 访问

### 方法 2: 通过 Git Push 自动部署

```bash
# 提交更改
git add -A
git commit -m "feat: ready for deployment"

# 推送到 GitHub
git push origin 001-description-netlify-bianca

# Netlify 将自动检测到推送并开始部署
```

### 方法 3: 通过 Netlify CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 链接站点（首次）
netlify link --id YOUR_SITE_ID

# 构建项目
pnpm run build

# 部署到生产环境
netlify deploy --prod --dir=dist
```

---

## 验证测试

### 部署后检查清单

#### 1. 网站可访问性
- [ ] 访问您的 Netlify 站点 URL
- [ ] 首页正常加载
- [ ] 没有 404 错误

#### 2. 用户认证测试
- [ ] 访问 `/register` 注册新账号
- [ ] 输入邮箱和密码
- [ ] 注册成功（或收到邮箱验证提示）
- [ ] 访问 `/login` 登录
- [ ] 登录成功后跳转到首页

#### 3. 市场行情测试
- [ ] 访问 `/markets` 查看行情
- [ ] 价格数据正常显示
- [ ] 24h涨跌幅显示正常
- [ ] 价格每5秒自动刷新

#### 4. 交易功能测试
- [ ] 访问 `/trade` 交易页面
- [ ] 先访问 `/wallet` 充值一些资产
- [ ] 返回交易页面，尝试创建市价单
- [ ] 市价单立即成交
- [ ] 尝试创建限价单
- [ ] 限价单进入当前委托列表
- [ ] 可以成功取消订单

#### 5. 钱包功能测试
- [ ] 访问 `/wallet` 钱包页面
- [ ] 余额显示正常
- [ ] 点击充值，输入金额，充值成功
- [ ] 余额更新正确
- [ ] 查看交易历史，记录完整

#### 6. 订单历史测试
- [ ] 访问 `/orders` 订单页面
- [ ] 当前委托显示正常
- [ ] 历史订单显示正常
- [ ] 筛选功能正常
- [ ] 分页功能正常

---

## 故障排查

### 常见问题及解决方案

#### 问题 1: 网站显示 "Page Not Found" (404)

**原因**: 构建失败或发布目录配置错误

**解决方案**:
1. 检查 Netlify 构建日志
2. 确认 "Publish directory" 设置为 `dist`
3. 确认 `package.json` 中 build 命令正确
4. 重新触发部署

#### 问题 2: 注册页面显示 "Network Error"

**原因**: Supabase 环境变量未配置或配置错误

**解决方案**:
1. 访问 Netlify → Site configuration → Environment variables
2. 确认 `PUBLIC_SUPABASE_URL` 和 `PUBLIC_SUPABASE_ANON_KEY` 已设置
3. 确认变量值正确（无额外空格）
4. 重新部署站点

#### 问题 3: 市场行情页面显示 "Failed to load"

**原因**: API 端点未正确路由或外部 API 调用失败

**解决方案**:
1. 检查浏览器开发者工具 Network 标签
2. 确认 `/api/market/tickers` 返回 200 状态码
3. 如果返回 404，检查 `netlify.toml` 重定向配置
4. 如果外部 API 失败，检查 API 密钥配置

#### 问题 4: 下单时显示 "Unauthorized"

**原因**: 用户未登录或 Session 过期

**解决方案**:
1. 退出登录重新登录
2. 检查浏览器 Cookie 是否被阻止
3. 确认 Supabase Auth 配置正确

#### 问题 5: 构建失败 "Module not found"

**原因**: 依赖未正确安装

**解决方案**:
1. 在 Netlify 构建设置中，确认使用 `pnpm run build`
2. 检查 `pnpm-lock.yaml` 是否提交到 Git
3. 清除 Netlify 缓存并重新构建

### 获取详细日志

**查看 Netlify 构建日志**:
1. Netlify Dashboard → Deploys
2. 点击最近的部署
3. 查看 "Deploy log"

**查看 Netlify 函数日志**:
1. Netlify Dashboard → Functions
2. 点击函数名称
3. 查看最近的调用日志

**查看 Supabase 日志**:
1. Supabase Dashboard → Logs
2. 选择 "Postgres" 或 "Auth" 查看相关日志

---

## 性能优化建议

### 1. 启用 Netlify CDN 缓存

`netlify.toml` 中已配置：

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2. 启用 Supabase 连接池

在 Supabase Dashboard → Settings → Database 中启用连接池以提高性能。

### 3. 配置自定义域名（可选）

1. 在 Netlify → Site configuration → Domain management
2. 点击 "Add custom domain"
3. 输入您的域名
4. 按照提示配置 DNS

---

## 安全检查清单

- [ ] Service Role Key 仅在服务器端使用，未暴露给客户端
- [ ] Supabase RLS 策略已启用所有表
- [ ] 所有用户输入已验证和清理
- [ ] HTTPS 已启用（Netlify 默认）
- [ ] 环境变量标记为 "Secret"
- [ ] 定期更新依赖项（`pnpm update`）
- [ ] 监控 Netlify 和 Supabase 使用配额

---

## 维护和监控

### 定期维护任务

**每周**:
- [ ] 检查 Netlify 和 Supabase 使用情况
- [ ] 检查错误日志

**每月**:
- [ ] 更新依赖项：`pnpm update`
- [ ] 备份 Supabase 数据库
- [ ] 检查安全漏洞：`pnpm audit`

**每季度**:
- [ ] 审查和更新安全策略
- [ ] 性能优化
- [ ] 用户反馈分析

### 监控工具建议

- **Uptime 监控**: [UptimeRobot](https://uptimerobot.com/) (免费)
- **错误追踪**: [Sentry](https://sentry.io/) (有免费计划)
- **性能监控**: [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 成本估算

### 免费层额度

**Supabase 免费计划**:
- 500 MB 数据库存储
- 1 GB 文件存储
- 50,000 MAU（月活跃用户）
- 每月 500 MB 出站流量

**Netlify 免费计划**:
- 100 GB 带宽/月
- 300 分钟构建时间/月
- 125K 无服务器函数调用/月

**结论**: 对于教育演示项目，免费计划完全足够！

---

## 获取帮助

### 官方文档
- [Astro 文档](https://docs.astro.build/)
- [Supabase 文档](https://supabase.com/docs)
- [Netlify 文档](https://docs.netlify.com/)

### 社区支持
- [Astro Discord](https://astro.build/chat)
- [Supabase Discord](https://discord.supabase.com/)
- [Netlify Community](https://answers.netlify.com/)

### 项目相关
- GitHub Issues: 提交 bug 或功能请求
- 项目文档: 查看 `specs/` 目录
- 实施状态: 查看 `IMPLEMENTATION_STATUS.md`

---

## 部署完成！🎉

恭喜您成功部署了加密货币交易平台！

**下一步**:
1. ✅ 分享您的网站 URL 给朋友测试
2. ✅ 收集用户反馈
3. ✅ 继续开发新功能（参考 `IMPLEMENTATION_STATUS.md`）
4. ✅ 定期维护和更新

**记住**: 这是一个教育演示项目，不处理真实资金。如需用于生产环境，请确保：
- 实施完整的安全审计
- 添加完整的测试覆盖
- 实施真实的支付网关
- 遵守当地金融监管法规

祝您部署顺利！🚀

