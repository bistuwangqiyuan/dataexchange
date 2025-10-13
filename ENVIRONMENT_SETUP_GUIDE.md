# 🔧 环境变量配置指南

本指南将帮助你正确配置Netlify环境变量，解决网站502错误问题。

---

## 🎯 快速解决方案

### 问题现象
访问 https://dataexchangegithub.netlify.app 显示:
```
This function has crashed
Error - An unknown error has occurred
```

### 根本原因
**Netlify上未配置必需的Supabase环境变量**

### 解决步骤

#### 步骤1: 获取Supabase凭证

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 登录你的账户
3. 选择你的项目（或创建新项目）
4. 点击左侧菜单 **Settings** → **API**
5. 复制以下信息:

```
📋 需要复制的值:

✅ Project URL (项目URL)
   示例: https://abcdefghijk.supabase.co
   → 用于: PUBLIC_SUPABASE_URL

✅ anon public (匿名公钥)
   示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   → 用于: PUBLIC_SUPABASE_ANON_KEY

✅ service_role (服务角色密钥) ⚠️ 保密
   点击 "Reveal" 按钮查看
   示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   → 用于: SUPABASE_SERVICE_ROLE_KEY
```

#### 步骤2: 配置Netlify环境变量

##### 方法A: 使用Netlify Dashboard (推荐)

1. 访问: https://app.netlify.com/sites/dataexchangegithub/configuration/env

2. 点击 **"Add a variable"** 或 **"New variable"**

3. 逐个添加以下变量:

```bash
# 变量1
Key: PUBLIC_SUPABASE_URL
Value: [粘贴你的Supabase项目URL]
Scopes: ✅ Production (必选)

# 变量2  
Key: PUBLIC_SUPABASE_ANON_KEY
Value: [粘贴你的anon public密钥]
Scopes: ✅ Production (必选)

# 变量3
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [粘贴你的service_role密钥]
Scopes: ✅ Production (必选)
Sensitive: ✅ 是 (可选，增加安全性)

# 变量4
Key: NODE_ENV
Value: production
Scopes: ✅ Production (必选)
```

4. 点击 **"Save"** 保存每个变量

##### 方法B: 使用Netlify CLI

```bash
# 确保已登录
netlify login

# 链接到项目
netlify link --id afad6430-6ae3-4503-a69a-bba8cf7c16c5

# 设置环境变量
netlify env:set PUBLIC_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set PUBLIC_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-role-key"
netlify env:set NODE_ENV "production"
```

#### 步骤3: 触发重新部署

配置完环境变量后，必须重新部署才能生效:

##### 选项A: Dashboard重新部署

1. 访问: https://app.netlify.com/sites/dataexchangegithub/deploys
2. 点击 **"Trigger deploy"** 按钮
3. 选择 **"Deploy site"**
4. 等待部署完成（约1-2分钟）

##### 选项B: CLI重新部署

```bash
cd C:\Users\wangqiyuan\project\cursor\dataexchange
netlify deploy --prod --site=afad6430-6ae3-4503-a69a-bba8cf7c16c5
```

##### 选项C: Git推送触发 (如果有Git连接)

```bash
git commit --allow-empty -m "Trigger rebuild after env vars setup"
git push origin main
```

#### 步骤4: 验证修复

部署完成后:

1. 访问: https://dataexchangegithub.netlify.app
2. **预期结果**: 看到登录页面（因为首页需要登录）
3. **如果仍然502**: 
   - 检查Function日志: https://app.netlify.com/projects/dataexchangegithub/logs/functions
   - 确认环境变量已正确保存
   - 确认重新部署已完成

---

## 🔍 故障排查

### 问题1: 仍然显示502错误

**检查清单**:

```bash
✅ 环境变量是否已保存?
   → 访问 Netlify Dashboard → Configuration → Environment variables
   → 确认4个变量都存在

✅ 环境变量值是否正确?
   → PUBLIC_SUPABASE_URL 应以 https:// 开头
   → 密钥应该很长 (100+ 字符)
   → 没有多余的空格或引号

✅ 是否重新部署了?
   → 访问 Deploys 页面
   → 最新部署应该是配置环境变量之后的

✅ Supabase项目是否正常?
   → 登录 Supabase Dashboard
   → 确认项目状态为 "Active"
```

### 问题2: 如何查看详细错误信息?

1. 访问Function日志:
   ```
   https://app.netlify.com/projects/dataexchangegithub/logs/functions
   ```

2. 查找SSR Function的错误:
   - 点击 "ssr" function
   - 查看最新的错误日志
   - 记录错误消息

3. 常见错误消息:
   ```
   "Missing Supabase environment variables"
   → 环境变量未配置或名称错误

   "Invalid API key"
   → Supabase密钥不正确

   "Failed to connect to Supabase"
   → Supabase URL错误或项目已暂停
   ```

### 问题3: 如何测试环境变量是否生效?

创建一个测试函数来检查环境变量:

```bash
# 在项目根目录
echo "export const handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      hasSupabaseUrl: !!process.env.PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    })
  };
};" > netlify/functions/check-env.ts

# 部署后访问
# https://dataexchangegithub.netlify.app/.netlify/functions/check-env
```

---

## 📚 环境变量说明

### PUBLIC_SUPABASE_URL
- **用途**: Supabase API的基础URL
- **格式**: `https://[project-id].supabase.co`
- **示例**: `https://abcdefg.supabase.co`
- **安全级别**: Public (可以暴露在前端)
- **必需**: ✅ 是

### PUBLIC_SUPABASE_ANON_KEY
- **用途**: 匿名访问密钥，用于客户端请求
- **格式**: JWT格式的长字符串
- **示例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...`
- **安全级别**: Public (可以暴露在前端，但有RLS保护)
- **必需**: ✅ 是

### SUPABASE_SERVICE_ROLE_KEY
- **用途**: 服务角色密钥，绕过RLS，用于后端操作
- **格式**: JWT格式的长字符串  
- **示例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...`
- **安全级别**: ⚠️ Secret (绝对不能暴露，仅后端使用)
- **必需**: ✅ 是

### NODE_ENV
- **用途**: 指定运行环境
- **格式**: `production` 或 `development`
- **示例**: `production`
- **安全级别**: Public
- **必需**: ✅ 推荐 (影响日志和错误处理)

---

## ⚡ 快速命令参考

```bash
# 查看当前环境变量
netlify env:list

# 设置环境变量
netlify env:set KEY "value"

# 删除环境变量
netlify env:unset KEY

# 查看部署状态
netlify status

# 查看最新日志
netlify logs:function ssr

# 重新部署
netlify deploy --prod --site=afad6430-6ae3-4503-a69a-bba8cf7c16c5
```

---

## ✅ 验证清单

配置完成后，使用此清单验证:

```
□ 已从Supabase Dashboard复制正确的凭证
□ 已在Netlify添加全部4个环境变量  
□ 环境变量名称完全匹配（区分大小写）
□ 已触发重新部署
□ 部署日志显示成功（无错误）
□ 访问首页不再显示502错误
□ 可以正常导航到其他页面
```

---

## 🆘 需要帮助?

如果按照本指南操作后仍然遇到问题:

1. **检查Function日志**:
   https://app.netlify.com/projects/dataexchangegithub/logs/functions

2. **检查部署日志**:
   https://app.netlify.com/sites/dataexchangegithub/deploys

3. **验证Supabase状态**:
   https://app.supabase.com

4. **查看项目文档**:
   - README.md
   - DEPLOYMENT_TEST_REPORT.md

---

*最后更新: 2025-10-12 20:24*

