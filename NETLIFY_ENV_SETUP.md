# Netlify 环境变量配置指南

## 项目信息

- **Netlify项目名称**: dataexchangenelify
- **项目URL**: https://dataexchangenelify.netlify.app
- **Admin URL**: https://app.netlify.com/projects/dataexchangenelify
- **Project ID**: a7eed217-92cc-40f0-aa2c-7f906e8ebd84

## 必需的环境变量

请在 Netlify Dashboard 中配置以下环境变量：

### 1. 访问 Netlify 环境变量设置

1. 打开 [Netlify Dashboard](https://app.netlify.com/projects/dataexchangenelify)
2. 点击 **Site settings** → **Environment variables**
3. 点击 **Add a variable** 添加以下变量

### 2. 添加 Supabase 配置

#### PUBLIC_SUPABASE_URL
- **值**: `https://zzyueuweeoakopuuwfau.supabase.co`
- **作用域**: All scopes
- **环境**: All environments

#### PUBLIC_SUPABASE_ANON_KEY
- **值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eXVldXdlZW9ha29wdXV3ZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODEzMDEsImV4cCI6MjA1OTk1NzMwMX0.y8V3EXK9QVd3txSWdE3gZrSs96Ao0nvpnd0ntZw_dQ4`
- **作用域**: All scopes
- **环境**: All environments

#### SUPABASE_SERVICE_ROLE_KEY (⚠️ 保密！)
- **值**: 需要在 [Supabase Dashboard](https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau/settings/api) 获取
  - 进入 Settings → API
  - 复制 **service_role** key（⚠️ 不要分享！）
- **作用域**: All scopes
- **环境**: All environments

### 3. 添加外部 API 配置（可选）

#### COINGECKO_API_URL
- **值**: `https://api.coingecko.com/api/v3`
- **作用域**: All scopes
- **环境**: All environments

#### BINANCE_API_URL
- **值**: `https://api.binance.com`
- **作用域**: All scopes
- **环境**: All environments

#### NODE_ENV
- **值**: `production`
- **作用域**: All scopes
- **环境**: Production only

## 通过 CLI 配置（备选方法）

如果 Netlify CLI 环境变量设置出现问题，可以使用以下命令：

```bash
# 方法 1: 使用 netlify env:set
netlify env:set PUBLIC_SUPABASE_URL https://zzyueuweeoakopuuwfau.supabase.co
netlify env:set PUBLIC_SUPABASE_ANON_KEY "your-anon-key-here"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-role-key-here"

# 方法 2: 使用 netlify env:import
# 创建 .env.production 文件，然后：
netlify env:import .env.production
```

## 验证环境变量

```bash
# 列出所有环境变量
netlify env:list

# 获取特定变量
netlify env:get PUBLIC_SUPABASE_URL
```

## 注意事项

1. **PUBLIC_** 前缀的变量会暴露到客户端代码中
2. **SUPABASE_SERVICE_ROLE_KEY** 绝不能暴露到客户端！仅用于 Netlify Functions
3. 环境变量更新后，需要重新部署才能生效
4. 建议在 Production 和 Preview 环境使用不同的 Supabase 项目

## 下一步

✅ 配置完环境变量后，运行以下命令部署：

```bash
pnpm run build
netlify deploy --prod
```

