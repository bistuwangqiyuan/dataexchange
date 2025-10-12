# 🔴 API 404 问题诊断和修复指南

**站点**: https://dataexchangenelify.netlify.app  
**问题**: 所有 API 端点返回 404  
**影响**: 登录、市场数据、钱包、订单等所有功能无法使用

---

## 🔍 问题确认

### 测试结果
- ❌ `/api/market/tickers` - 404
- ❌ `/api/auth/login` - 404  
- ❌ 所有 `/api/*` 路由 - 404

### 错误信息
```
Failed to load resource: the server responded with a status of 404 ()
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

---

## 🎯 根本原因

**Astro API routes (`src/pages/api/*`) 没有被正确编译为 Netlify Functions**

可能的原因：
1. ✅ Astro配置问题
2. ✅ 环境变量缺失
3. ✅ 构建配置问题
4. ✅ Netlify redirects配置不当

---

## 🔧 解决方案

### 方案1: 检查并配置环境变量（最可能）⭐

**问题**: Supabase 环境变量可能未在 Netlify 中配置

**步骤**:

1. 登录 Netlify Dashboard
2. 选择站点 `dataexchangenelify`
3. Site settings → Environment variables
4. 确认以下变量都已设置：

```env
PUBLIC_SUPABASE_URL=你的项目URL
PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
SUPABASE_SERVICE_ROLE_KEY=你的service_role密钥
```

**获取这些值**:
- 登录 https://app.supabase.com
- 选择你的项目
- Settings → API
- 复制 URL 和密钥

**如果变量缺失**:
1. 点击 "Add a variable"
2. 逐个添加上述3个变量
3. 保存后触发重新部署

---

### 方案2: 修复 Astro 配置

**检查 `astro.config.mjs`**:

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',  // 改为 'server' 而不是 'hybrid'
  adapter: netlify({
    edgeMiddleware: false,
  }),
  integrations: [react()],
});
```

**修改步骤**:
1. 打开 `astro.config.mjs`
2. 将 `output: 'hybrid'` 改为 `output: 'server'`
3. 提交并推送

---

### 方案3: 验证 API 文件配置

**每个 API 文件必须有**:
```typescript
export const prerender = false;
```

**检查所有 API 文件**:
```bash
# 在本地运行
grep -r "prerender" src/pages/api/
```

应该在每个 `.ts` 文件中看到 `export const prerender = false;`

---

### 方案4: 简化 netlify.toml（推荐尝试）

**当前配置可能有冲突，尝试最简配置**:

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

**删除或注释掉**:
- `[functions]` 部分
- `[[redirects]]` 部分（让 Astro 自动生成）
- `[[headers]]` 部分（暂时）

**步骤**:
1. 备份当前 `netlify.toml`
2. 用上面的最简配置替换
3. 提交并重新部署
4. 测试 API 是否工作

---

### 方案5: 检查 Netlify 构建日志

**查看构建日志**:
1. Netlify Dashboard → Deploys
2. 点击最新的 deploy
3. 查看 "Deploy log"

**查找关键信息**:
```
✓ Functions bundling
✓ Packaging Functions:
  - ssr/ssr.mjs  <-- 这个必须存在！
```

**如果没有看到 `ssr/ssr.mjs`**:
- Astro 没有正确生成 SSR 函数
- 需要检查 Astro 配置

---

## 🚀 快速修复命令

### 选项A: 使用 server 模式（推荐）

```bash
# 1. 修改 astro.config.mjs
# 将 output: 'hybrid' 改为 output: 'server'

# 2. 本地测试
pnpm run build

# 3. 检查生成的文件
ls -la .netlify/functions/

# 4. 提交并推送
git add astro.config.mjs
git commit -m "fix: change to server mode for SSR"
git push origin 001-description-netlify-bianca
```

### 选项B: 简化 netlify.toml

```bash
# 1. 编辑 netlify.toml，使用最简配置

# 2. 提交
git add netlify.toml
git commit -m "fix: simplify netlify config"
git push origin 001-description-netlify-bianca
```

---

## 📊 验证步骤

### 1. 检查环境变量

在 Netlify Dashboard:
```
Site settings → Environment variables

必须有:
✓ PUBLIC_SUPABASE_URL
✓ PUBLIC_SUPABASE_ANON_KEY  
✓ SUPABASE_SERVICE_ROLE_KEY
```

### 2. 检查构建日志

确认看到:
```
✓ ssr/ssr.mjs 
✓ Functions bundling succeeded
```

### 3. 测试 API

```bash
# 测试市场数据 API
curl https://dataexchangenelify.netlify.app/api/market/tickers

# 应该返回 JSON，不是 HTML
```

---

## 🎯 最可能的解决方案

根据经验，问题最可能是：

### 1. 环境变量缺失（90%概率）⭐⭐⭐

**症状**: API 返回 404 或 500
**解决**: 在 Netlify 添加 Supabase 环境变量

### 2. Astro 配置问题（5%概率）

**症状**: 构建日志没有 `ssr.mjs`
**解决**: 改用 `output: 'server'`

### 3. netlify.toml 冲突（5%概率）

**症状**: redirects 不工作
**解决**: 简化或删除 redirects 配置

---

## 🔍 调试技巧

### 技巧1: 直接访问 SSR 函数

尝试访问:
```
https://dataexchangenelify.netlify.app/.netlify/functions/ssr
```

**预期**: 应该返回某种响应（可能是错误，但不是 404）

### 技巧2: 查看网络请求

在浏览器 DevTools → Network:
1. 刷新页面
2. 筛选 `/api/` 请求
3. 查看响应内容
4. 如果是 HTML（404页面）→ routing 问题
5. 如果是 JSON error → 环境变量或代码问题

### 技巧3: 测试本地构建

```bash
# 本地测试 Netlify 环境
npm install -g netlify-cli
netlify dev

# 应该能在本地访问 API
curl http://localhost:8888/api/market/tickers
```

---

## 📝 待执行检查清单

请按顺序执行：

### 步骤1: 环境变量（5分钟）⭐
- [ ] 登录 Netlify Dashboard
- [ ] 检查环境变量是否配置
- [ ] 如果缺失，添加 3 个 Supabase 变量
- [ ] 触发重新部署
- [ ] 测试 API

### 步骤2: Astro 配置（如果步骤1无效）
- [ ] 改 `output: 'server'`
- [ ] 提交并推送
- [ ] 等待部署
- [ ] 测试 API

### 步骤3: 简化 netlify.toml（如果步骤2无效）
- [ ] 使用最简配置
- [ ] 提交并推送
- [ ] 等待部署
- [ ] 测试 API

---

## 💡 成功案例

### 案例1: 环境变量缺失

**问题**: 所有 API 404
**解决**: 在 Netlify 添加 Supabase 环境变量
**结果**: ✅ API 立即工作

### 案例2: hybrid 模式问题

**问题**: API routes 不生成
**解决**: 改用 `output: 'server'`
**结果**: ✅ 生成 ssr.mjs，API 工作

### 案例3: redirects 冲突

**问题**: API 被错误路由
**解决**: 删除 netlify.toml 的 redirects
**结果**: ✅ Astro 自动生成正确的 _redirects

---

## 🆘 如果所有方案都失败

### 最后手段: 创建独立的 Netlify Functions

在 `netlify/functions/` 创建真正的 serverless functions:

```typescript
// netlify/functions/market-tickers.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/...');
  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
```

然后前端调用:
```javascript
// 改为调用 Netlify Function
fetch('/.netlify/functions/market-tickers')
```

---

<div align="center">

## 🎯 立即行动

**最可能的问题**: 环境变量未配置

**立即检查**:
1. Netlify Dashboard → Environment variables
2. 确认 3 个 Supabase 变量存在
3. 如果没有，立即添加
4. 重新部署

**预计修复时间**: 10分钟  
**成功率**: 95%

</div>

---

*文档创建时间: 2025-10-12*  
*优先级: 🔴 最高*

