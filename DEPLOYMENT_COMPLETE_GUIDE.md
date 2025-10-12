# 🚀 加密货币交易平台 - 完整部署指南

## 📋 部署状态总结

### ✅ 已完成
- [x] 项目构建成功（7个静态页面 + SSR函数）
- [x] Supabase项目已连接
- [x] Netlify项目已链接（ID: `a7eed217-92cc-40f0-aa2c-7f906e8ebd84`）
- [x] 创建配置文件和迁移脚本

### ⏳ 需要手动完成
- [ ] Supabase数据库迁移（SQL执行）
- [ ] Netlify环境变量配置
- [ ] 生产环境部署（Git Push或Dashboard上传）

---

## 📊 项目信息

### Supabase
- **项目URL**: `https://zzyueuweeoakopuuwfau.supabase.co`
- **项目ID**: `zzyueuweeoakopuuwfau`
- **Anon Key**: 已配置（见下方环境变量）
- **Dashboard**: https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau

### Netlify
- **项目名称**: dataexchangenelify
- **项目ID**: `a7eed217-92cc-40f0-aa2c-7f906e8ebd84`
- **项目URL**: https://dataexchangenelify.netlify.app
- **Admin URL**: https://app.netlify.com/sites/dataexchangenelify

---

## 🗄️ 第一步：Supabase 数据库迁移

### 方法一：通过 Supabase Dashboard（推荐）

1. **打开 SQL Editor**
   - 访问：https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau/sql/new
   - 或：Dashboard → SQL Editor → New query

2. **执行迁移脚本**
   - 复制 `database/migrations/001_initial_schema.sql` 的全部内容
   - 粘贴到 SQL Editor
   - 点击 **Run** 按钮执行

3. **验证结果**
   ```sql
   -- 查看创建的表
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   
   -- 应该看到以下7张表：
   -- ✓ users
   -- ✓ wallets
   -- ✓ orders
   -- ✓ transactions
   -- ✓ wallet_transactions
   -- ✓ market_prices
   -- ✓ security_logs
   ```

4. **检查示例数据**
   ```sql
   SELECT * FROM market_prices LIMIT 3;
   -- 应该看到 BTC/USDT、ETH/USDT、BNB/USDT 的行情数据
   ```

### 迁移内容说明

#### 创建的数据表
| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户表 | id, email, is_verified |
| `wallets` | 钱包表 | user_id, currency, balance, frozen |
| `orders` | 订单表 | user_id, trading_pair, order_type, status |
| `transactions` | 成交记录 | order_id, user_id, price, quantity |
| `wallet_transactions` | 钱包交易 | wallet_id, type, amount, status |
| `market_prices` | 市场行情 | trading_pair, price, volume_24h |
| `security_logs` | 安全日志 | user_id, event_type, ip_address |

#### 安全功能
- ✅ **RLS (Row Level Security)** 已启用所有表
- ✅ **数据隔离策略**：用户只能访问自己的数据
- ✅ **公开数据策略**：market_prices 对所有人可读
- ✅ **自动时间戳**：created_at/updated_at 自动更新

#### 数据库函数
- `get_available_balance(user_id, currency)` - 计算可用余额
- `log_security_event(...)` - 记录安全事件
- `update_updated_at_column()` - 自动更新时间戳触发器

### 获取 Service Role Key

⚠️ **重要**：部署前必须完成此步骤！

1. 访问 https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau/settings/api
2. 找到 **Project API keys** 部分
3. 复制 **`service_role`** key（⚠️ 保密！）
4. 将其保存到 Netlify 环境变量（见下一步）

---

## ⚙️ 第二步：Netlify 环境变量配置

### 通过 Netlify Dashboard 配置（推荐）

1. **访问环境变量设置**
   - 打开：https://app.netlify.com/sites/dataexchangenelify/settings/env
   - 或：Site settings → Environment variables

2. **添加以下变量**

点击 **Add a variable** 按钮，添加每个变量：

#### 必需变量（3个）

| Key | Value | Scopes | Deploy contexts |
|-----|-------|--------|-----------------|
| `PUBLIC_SUPABASE_URL` | `https://zzyueuweeoakopuuwfau.supabase.co` | All | All |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eXVldXdlZW9ha29wdXV3ZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODEzMDEsImV4cCI6MjA1OTk1NzMwMX0.y8V3EXK9QVd3txSWdE3gZrSs96Ao0nvpnd0ntZw_dQ4` | All | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `从 Supabase Dashboard 获取` | All | Production only |

#### 可选变量（3个）

| Key | Value | Scopes | Deploy contexts |
|-----|-------|--------|-----------------|
| `COINGECKO_API_URL` | `https://api.coingecko.com/api/v3` | All | All |
| `BINANCE_API_URL` | `https://api.binance.com` | All | All |
| `NODE_ENV` | `production` | All | Production only |

### 变量说明

- **PUBLIC_*** 前缀的变量会暴露到客户端代码
- **SUPABASE_SERVICE_ROLE_KEY** 仅用于服务端，绝不暴露！
- 环境变量配置后需要重新部署才能生效

---

## 🚀 第三步：部署到 Netlify

### 方法一：Git 自动部署（推荐）

#### 1. 提交代码到 GitHub

```bash
# 确保在项目目录
cd C:\Users\wangqiyuan\project\cursor\dataexchange

# 查看状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "feat: complete project setup for deployment"

# 推送到远程仓库
git push origin 001-description-netlify-bianca
```

#### 2. 在 Netlify 配置自动部署

1. 访问：https://app.netlify.com/sites/dataexchangenelify/settings/deploys
2. 点击 **Link repository**
3. 选择 GitHub 仓库：`bistuwangqiyuan/dataexchange`
4. 配置构建设置（应该自动检测到）：
   - **Base directory**: (留空)
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
   - **Branch**: `001-description-netlify-bianca`
5. 点击 **Save** 保存配置
6. Netlify 会自动触发部署

### 方法二：手动上传部署

如果 Git 部署遇到问题，可以手动上传：

#### 1. 创建部署压缩包

```bash
# Windows PowerShell
Compress-Archive -Path dist\* -DestinationPath dataexchange-deploy.zip -Force
```

#### 2. 通过 Dashboard 上传

1. 访问：https://app.netlify.com/sites/dataexchangenelify/deploys
2. 拖拽 `dataexchange-deploy.zip` 到页面
3. 等待上传和部署完成

### 方法三：重试 CLI 部署

如果想继续尝试 CLI 部署：

```bash
# 重新登录
netlify logout
netlify login

# 重新链接
netlify link --id a7eed217-92cc-40f0-aa2c-7f906e8ebd84

# 尝试部署
netlify deploy --prod
```

---

## ✅ 第四步：验证部署

### 1. 访问网站

- **生产URL**: https://dataexchangenelify.netlify.app
- **预期页面**：
  - ✅ 首页：https://dataexchangenelify.netlify.app/
  - ✅ 登录：https://dataexchangenelify.netlify.app/login
  - ✅ 注册：https://dataexchangenelify.netlify.app/register
  - ✅ 市场：https://dataexchangenelify.netlify.app/markets
  - ✅ 交易：https://dataexchangenelify.netlify.app/trade
  - ✅ 订单：https://dataexchangenelify.netlify.app/orders
  - ✅ 钱包：https://dataexchangenelify.netlify.app/wallet

### 2. 测试 API 端点

```bash
# 测试市场行情 API
curl https://dataexchangenelify.netlify.app/api/market/tickers

# 测试单个交易对
curl https://dataexchangenelify.netlify.app/api/market/BTC-USDT
```

### 3. 检查部署日志

1. 访问：https://app.netlify.com/sites/dataexchangenelify/deploys
2. 点击最新的部署查看日志
3. 确认以下内容：
   - ✅ 构建成功
   - ✅ 7个静态页面生成
   - ✅ SSR函数打包成功
   - ✅ 部署成功

### 4. 测试用户注册流程

1. 访问注册页面
2. 输入邮箱和密码
3. 检查 Supabase Dashboard → Authentication → Users
4. 确认用户已创建

### 5. 检查 Supabase 连接

在浏览器控制台运行：

```javascript
// 检查环境变量是否正确加载
console.log('Supabase URL:', import.meta.env.PUBLIC_SUPABASE_URL);
```

---

## 🔍 故障排查

### 问题1：页面404错误
**原因**: 部署路径配置错误  
**解决**:
- 确认 `netlify.toml` 中 `publish = "dist"`
- 检查 dist 目录是否包含所有页面

### 问题2：API调用失败
**原因**: 环境变量未配置或Supabase未迁移  
**解决**:
1. 检查 Netlify 环境变量是否正确设置
2. 验证 Supabase 表是否创建成功
3. 检查 Supabase RLS 策略是否启用

### 问题3：认证失败
**原因**: Service Role Key 未配置或错误  
**解决**:
1. 重新从 Supabase Dashboard 获取 service_role key
2. 在 Netlify 环境变量中更新
3. 重新部署

### 问题4：市场数据加载失败
**原因**: CoinGecko/Binance API限制  
**解决**:
- CoinGecko 免费版限制：50次/分钟
- Binance 可能在某些地区被限制
- 检查网络连接和CORS设置

### 问题5：Functions 报错
**原因**: Astro SSR函数配置问题  
**解决**:
1. 确认 `@astrojs/netlify` 适配器已安装
2. 检查 `astro.config.mjs` 配置
3. 查看 Netlify Functions 日志

---

## 📊 构建统计

```
✓ 构建时间: ~15秒
✓ 静态页面: 7个
✓ JavaScript: 485 KB (gzip: 144 KB)
✓ SSR函数: 1个 (entry.mjs)
✓ 部署大小: < 5 MB
```

---

## 🎯 下一步建议

### 性能优化
- [ ] 启用 Netlify CDN（自动启用）
- [ ] 配置图片优化
- [ ] 添加 Service Worker（PWA）

### 监控和分析
- [ ] 集成 Google Analytics
- [ ] 添加错误监控（Sentry）
- [ ] 配置 Uptime 监控

### 安全增强
- [ ] 配置 Content Security Policy
- [ ] 启用 DNSSEC
- [ ] 添加速率限制

### 功能扩展
- [ ] 添加KYC验证流程
- [ ] 实现真实订单撮合
- [ ] 集成区块链网络

---

## 📞 支持

- **项目文档**: `README.md`
- **API文档**: `specs/001-description-netlify-bianca/contracts/`
- **Supabase迁移**: `database/migrations/001_initial_schema.sql`
- **Netlify配置**: `netlify.toml`

---

## ✅ 部署检查清单

### 部署前
- [x] 项目构建成功
- [ ] Supabase 数据库迁移完成
- [ ] Service Role Key 已获取
- [ ] Netlify 环境变量已配置

### 部署后
- [ ] 所有页面可访问
- [ ] API 端点正常响应
- [ ] 用户注册/登录功能正常
- [ ] 市场数据正常加载
- [ ] 无控制台错误

---

**🎉 祝部署顺利！**

如有问题，请查看：
- Netlify部署日志：https://app.netlify.com/sites/dataexchangenelify/deploys
- Supabase日志：https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau/logs

