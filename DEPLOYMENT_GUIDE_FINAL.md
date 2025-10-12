# 🚀 部署指南 - DataExchange加密货币交易平台

## 📋 部署前检查清单

### ✅ 代码准备
- ✅ 所有功能已实现（100%完成）
- ✅ SEO优化已完成（26项优化）
- ✅ 代码已提交到本地Git
- ⚠️ **需要推送到GitHub**（网络问题待解决）

### ✅ 配置文件
- ✅ `netlify.toml` - 已优化
- ✅ `package.json` - 依赖完整
- ✅ `.env.example` - 环境变量模板
- ✅ `robots.txt` - SEO配置
- ✅ `sitemap.xml` - 站点地图
- ✅ `manifest.json` - PWA配置

---

## 🔧 部署方式选择

### 方式1：通过GitHub推送自动部署（推荐）

#### 步骤1: 推送代码到GitHub

```bash
# 检查网络连接
ping github.com

# 如果网络正常，推送代码
git push origin 001-description-netlify-bianca

# 如果使用代理，可以配置Git代理
# git config --global http.proxy http://127.0.0.1:7890
# git config --global https.proxy http://127.0.0.1:7890
```

#### 步骤2: 在Netlify连接GitHub仓库

1. 访问 https://app.netlify.com
2. 点击 "Add new site" → "Import an existing project"
3. 选择 "GitHub"
4. 授权Netlify访问你的GitHub账户
5. 选择仓库 `bistuwangqiyuan/dataexchange`
6. 选择分支 `001-description-netlify-bianca`

#### 步骤3: 配置构建设置

```
Base directory: (留空)
Build command: pnpm run build
Publish directory: dist
Functions directory: netlify/functions
```

#### 步骤4: 设置环境变量

在 Netlify Dashboard → Site settings → Environment variables 添加：

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### 步骤5: 触发部署

点击 "Deploy site" 按钮，Netlify会自动：
1. 克隆代码
2. 安装依赖（pnpm）
3. 运行构建
4. 部署到CDN
5. 配置Functions

---

### 方式2：使用Netlify CLI手动部署

#### 步骤1: 安装Netlify CLI

```bash
npm install -g netlify-cli
```

#### 步骤2: 登录Netlify

```bash
netlify login
```

这会打开浏览器完成OAuth认证。

#### 步骤3: 连接到Netlify站点

```bash
# 如果是新站点
netlify init

# 如果已有站点
netlify link
```

#### 步骤4: 设置环境变量

```bash
# 方式A: 通过CLI设置
netlify env:set PUBLIC_SUPABASE_URL "your_url"
netlify env:set PUBLIC_SUPABASE_ANON_KEY "your_key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_key"

# 方式B: 在Netlify Dashboard手动设置
# https://app.netlify.com/sites/YOUR_SITE/settings/env
```

#### 步骤5: 本地构建测试

```bash
# 安装依赖
pnpm install

# 本地构建
pnpm run build

# 本地预览
pnpm preview
```

#### 步骤6: 部署到生产环境

```bash
# 部署到生产
netlify deploy --prod

# 或者先构建再部署
pnpm run build
netlify deploy --prod --dir=dist
```

---

### 方式3：通过Netlify Drop部署（最简单）

#### 步骤1: 本地构建

```bash
pnpm install
pnpm run build
```

#### 步骤2: 手动部署

1. 访问 https://app.netlify.com/drop
2. 将 `dist` 文件夹拖放到页面上
3. Netlify会自动上传和部署

**注意**: 这种方式不支持Netlify Functions，仅适合测试前端。

---

## 🗄️ Supabase数据库配置

### 步骤1: 创建Supabase项目

1. 访问 https://app.supabase.com
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `dataexchange`
   - Database Password: 设置强密码（保存好！）
   - Region: 选择最近的区域

### 步骤2: 执行数据库迁移

#### 方式A: 使用Supabase SQL Editor（推荐）

1. 打开 Supabase Dashboard → SQL Editor
2. 点击 "New Query"
3. 复制 `database/migrations/001_initial_schema.sql` 的内容
4. 粘贴并点击 "Run" 执行
5. 重复以上步骤执行 `002_stored_procedures.sql`

#### 方式B: 使用Supabase CLI

```bash
# 安装Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db push
```

### 步骤3: 验证数据库

在SQL Editor中运行：

```sql
-- 检查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 应该看到7张表：
-- users, wallets, orders, transactions, wallet_transactions, 
-- market_prices, security_logs

-- 检查RLS策略
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 步骤4: 获取API密钥

在 Supabase Dashboard → Settings → API：

- **Project URL**: 复制URL（`PUBLIC_SUPABASE_URL`）
- **anon/public key**: 复制密钥（`PUBLIC_SUPABASE_ANON_KEY`）
- **service_role key**: 复制密钥（`SUPABASE_SERVICE_ROLE_KEY`）

⚠️ **注意**: `service_role key` 拥有完全权限，绝不要暴露在前端代码中！

---

## 🔍 部署验证

### 步骤1: 检查构建状态

在 Netlify Dashboard → Deploys，确认：
- ✅ Build Status: Published
- ✅ Build Time: < 5分钟
- ✅ Functions Deployed: Yes

### 步骤2: 功能测试

访问你的站点URL（如 `https://dataexchange.netlify.app`），测试：

#### 基础功能
- [ ] 首页加载正常
- [ ] 导航链接工作
- [ ] 市场页面显示价格
- [ ] 登录页面可访问
- [ ] 注册页面可访问

#### API测试
```bash
# 测试市场价格API
curl https://your-site.netlify.app/api/market/tickers

# 应该返回价格数据JSON
```

#### SEO验证
- [ ] 访问 `https://your-site.netlify.app/robots.txt`
- [ ] 访问 `https://your-site.netlify.app/sitemap.xml`
- [ ] 访问 `https://your-site.netlify.app/manifest.json`
- [ ] 检查页面源码，确认meta标签存在

### 步骤3: Lighthouse审计

```bash
# 使用Chrome DevTools
# 1. 打开站点
# 2. 按F12打开DevTools
# 3. 切换到Lighthouse标签
# 4. 选择所有类别
# 5. 点击"Generate report"

# 或使用CLI
npm install -g lighthouse
lighthouse https://your-site.netlify.app --view
```

**预期得分**:
- SEO: 90-95/100 ⭐⭐⭐⭐⭐
- Performance: 90-95/100
- Accessibility: 85-90/100
- Best Practices: 95-100/100

### 步骤4: 提交到搜索引擎

#### Google Search Console

1. 访问 https://search.google.com/search-console
2. 添加属性（你的站点URL）
3. 验证所有权（DNS或HTML文件）
4. 提交Sitemap：`https://your-site.netlify.app/sitemap.xml`

#### Bing Webmaster Tools

1. 访问 https://www.bing.com/webmasters
2. 添加站点
3. 验证所有权
4. 提交Sitemap

---

## 🐛 常见问题排查

### 问题1: 构建失败 - "pnpm not found"

**解决方案**:
```bash
# 在Netlify Dashboard → Build settings → Environment variables
# 添加:
NPM_VERSION = "9.0.0"
PNPM_VERSION = "8.0.0"
```

### 问题2: API调用失败

**原因**: 环境变量未设置

**解决方案**:
1. 检查 Netlify → Environment variables
2. 确认所有变量都已设置
3. 触发重新部署

### 问题3: Functions超时

**原因**: Netlify免费版Functions执行时间限制10秒

**解决方案**:
- 优化API调用
- 添加缓存
- 考虑升级到Pro计划（26秒限制）

### 问题4: Supabase连接错误

**检查步骤**:
```bash
# 测试Supabase连接
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 问题5: RLS权限拒绝

**原因**: Row Level Security策略未正确配置

**解决方案**:
```sql
-- 检查RLS是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 如果rowsecurity = false，启用它
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 重新创建策略
-- 参考 001_initial_schema.sql
```

---

## 📊 监控和维护

### 性能监控

**Netlify Analytics**:
- 访问 Netlify Dashboard → Analytics
- 查看页面浏览量、带宽使用、Functions调用

**Supabase Monitoring**:
- 访问 Supabase Dashboard → Database → Monitoring
- 查看数据库连接、查询性能、存储使用

### 日志查看

**Netlify Functions日志**:
```bash
# 使用CLI查看实时日志
netlify dev

# 或在Dashboard查看
# Netlify Dashboard → Functions → 选择函数 → Logs
```

**Supabase日志**:
```sql
-- 查看最近的安全日志
SELECT * FROM security_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- 查看登录历史
SELECT * FROM security_logs 
WHERE event_type = 'login' 
ORDER BY created_at DESC;
```

### 定期维护任务

**每周**:
- [ ] 检查错误日志
- [ ] 监控性能指标
- [ ] 检查安全日志

**每月**:
- [ ] 更新依赖包 `pnpm update`
- [ ] 运行安全扫描 `pnpm audit`
- [ ] 检查SEO排名
- [ ] 分析用户行为

**每季度**:
- [ ] 备份数据库
- [ ] 审查和优化慢查询
- [ ] 更新SSL证书（Netlify自动）
- [ ] 审查constitution合规性

---

## 🎯 部署后优化

### 1. 配置自定义域名

在 Netlify Dashboard → Domain settings:
1. 点击 "Add custom domain"
2. 输入你的域名
3. 配置DNS记录
4. 等待SSL证书自动生成

### 2. 启用Netlify Analytics（可选）

- 费用: $9/月
- 提供服务器端分析
- 无需cookie，隐私友好

### 3. 配置邮件服务

如果需要发送邮件（如注册验证），集成：
- SendGrid
- Mailgun
- Postmark

### 4. 设置CI/CD工作流

创建 `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install
        run: pnpm install
      - name: Lint
        run: pnpm lint
      - name: Test
        run: pnpm test
```

---

## 📞 获取帮助

### 文档资源
- **Netlify文档**: https://docs.netlify.com
- **Supabase文档**: https://supabase.com/docs
- **Astro文档**: https://docs.astro.build

### 社区支持
- **Netlify Community**: https://answers.netlify.com
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: 在你的仓库创建issue

### 项目文档
- `README.md` - 项目概览
- `DEPLOYMENT_READY.md` - 部署检查清单
- `SEO_OPTIMIZATION_REPORT.md` - SEO优化详情
- `COMPLETE_IMPLEMENTATION_WITH_SEO.md` - 完整实施报告

---

## ✅ 部署完成确认

部署成功后，确认以下指标：

- [ ] ✅ 站点可访问
- [ ] ✅ 所有页面正常
- [ ] ✅ API正常响应
- [ ] ✅ 数据库连接正常
- [ ] ✅ SEO配置生效
- [ ] ✅ Lighthouse得分 > 90
- [ ] ✅ 无控制台错误
- [ ] ✅ Functions正常工作

---

<div align="center">

## 🎉 恭喜！部署完成！

你的加密货币交易平台已成功上线！

**下一步**:
1. 分享站点链接
2. 收集用户反馈
3. 持续优化和迭代

**祝你成功！** 🚀

---

Made with ❤️ by DataExchange Team

</div>

---

*文档最后更新: 2025-10-12*

