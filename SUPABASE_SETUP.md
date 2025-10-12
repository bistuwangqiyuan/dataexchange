# 🗄️ Supabase数据库设置指南

## 📋 概述

本指南将帮助您在Supabase上设置DataExchange项目的数据库。

---

## 🚀 快速开始

### 步骤1: 创建Supabase项目

1. 访问 https://app.supabase.com
2. 点击 **"New Project"**
3. 填写信息：
   - **Name**: `dataexchange`
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择最近的区域（如 `East Asia (Tokyo)`）
   - **Pricing Plan**: 选择 `Free` 或 `Pro`

4. 点击 **"Create new project"**
5. 等待项目创建（约2分钟）

---

## 📝 执行数据库迁移

### 方式1: 使用SQL Editor（推荐）

#### 1.1 执行初始架构

1. 在Supabase Dashboard，点击左侧 **"SQL Editor"**
2. 点击 **"New Query"**
3. 打开本地文件 `database/migrations/001_initial_schema.sql`
4. **复制全部内容**
5. **粘贴到SQL Editor**
6. 点击 **"Run"** 按钮（或按 `Ctrl+Enter`）
7. 等待执行完成，应该看到 "Success" 消息

#### 1.2 执行存储过程

1. 再次点击 **"New Query"**
2. 打开本地文件 `database/migrations/002_stored_procedures.sql`
3. **复制全部内容**
4. **粘贴到SQL Editor**
5. 点击 **"Run"**
6. 等待执行完成

---

### 方式2: 使用Supabase CLI

```bash
# 1. 安装Supabase CLI
npm install -g supabase

# 2. 登录Supabase
supabase login

# 3. 链接到你的项目
supabase link --project-ref your-project-ref

# 4. 推送迁移
supabase db push
```

---

## ✅ 验证数据库

### 检查表是否创建成功

在SQL Editor中运行：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**预期结果**（7张表）:
- `market_prices`
- `orders`
- `security_logs`
- `transactions`
- `users`
- `wallet_transactions`
- `wallets`

### 检查RLS策略

```sql
-- 查看所有RLS策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

应该看到每张表都有相应的RLS策略。

### 检查存储过程

```sql
-- 查看所有函数
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**预期结果**（5个函数）:
- `cancel_order`
- `create_order`
- `execute_market_order`
- `update_balance`
- `withdraw_funds`

---

## 🔑 获取API密钥

### 步骤1: 进入API设置

1. 在Supabase Dashboard，点击左下角 **"Settings"**（齿轮图标）
2. 点击 **"API"**

### 步骤2: 复制密钥

你需要复制3个值：

#### 1. Project URL
```
https://xxxxxxxxxx.supabase.co
```
这是你的 `PUBLIC_SUPABASE_URL`

#### 2. anon/public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
这是你的 `PUBLIC_SUPABASE_ANON_KEY`

#### 3. service_role Key （⚠️ 保密！）
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
这是你的 `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **警告**: `service_role` key拥有完全数据库权限，**绝对不要**暴露在前端代码中！

---

## 🔐 配置环境变量

### 在本地开发（`.env`文件）

创建 `.env` 文件：

```env
PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
```

### 在Netlify生产环境

1. 访问 Netlify Dashboard
2. 选择你的站点
3. 点击 **"Site settings"**
4. 点击左侧 **"Environment variables"**
5. 点击 **"Add a variable"**
6. 逐个添加3个变量

---

## 🧪 测试数据库连接

### 测试1: 使用Supabase Studio

1. 在Supabase Dashboard，点击 **"Table Editor"**
2. 点击 `users` 表
3. 点击 **"Insert row"**
4. 尝试手动插入一条测试数据
5. 如果成功，说明数据库正常工作

### 测试2: 使用API

```bash
# 测试REST API连接
curl https://你的项目.supabase.co/rest/v1/users \
  -H "apikey: 你的anon_key" \
  -H "Authorization: Bearer 你的anon_key"

# 应该返回空数组或用户数据
[]
```

### 测试3: 本地代码测试

创建 `test-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://你的项目.supabase.co'
const supabaseKey = '你的anon_key'
const supabase = createClient(supabaseUrl, supabaseKey)

// 测试查询
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ 连接失败:', error)
} else {
  console.log('✅ 连接成功!', data)
}
```

运行：
```bash
node test-supabase.js
```

---

## 📊 数据库结构概览

### 核心表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `users` | 用户账户 | id, email, username |
| `wallets` | 钱包余额 | user_id, currency, balance |
| `orders` | 交易订单 | user_id, pair, type, status |
| `transactions` | 交易记录 | order_id, user_id, amount |
| `wallet_transactions` | 充值/提现 | user_id, currency, type |
| `market_prices` | 市场价格 | symbol, price, cached_at |
| `security_logs` | 安全日志 | user_id, event_type |

### 关系图

```
users (1) ----< (*) wallets
users (1) ----< (*) orders
orders (1) ----< (*) transactions
users (1) ----< (*) wallet_transactions
users (1) ----< (*) security_logs
```

---

## 🔒 安全最佳实践

### 1. Row Level Security (RLS)

✅ 所有表都已启用RLS  
✅ 用户只能访问自己的数据  
✅ 价格数据对所有人只读

验证：
```sql
-- 检查RLS是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- rowsecurity应该都是 true
```

### 2. 服务角色密钥保护

❌ **绝不要**在前端代码中使用 `service_role` key  
✅ 只在Netlify Functions（服务端）中使用  
✅ 在Netlify环境变量中设置（不要提交到Git）

### 3. 数据库备份

在Supabase Dashboard:
1. 点击 **"Database"** → **"Backups"**
2. 免费版每天自动备份（保留7天）
3. Pro版可自定义备份策略

---

## 🐛 常见问题

### Q1: 表创建失败 - "permission denied"
**A**: 确认你使用的是项目Owner账户登录Supabase

### Q2: RLS策略导致查询返回空
**A**: 检查JWT token是否正确，用户是否已认证
```sql
-- 临时禁用RLS调试（生产环境不要这样做！）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Q3: 外键约束错误
**A**: 按顺序执行SQL，确保`users`表先创建

### Q4: 存储过程执行失败
**A**: 检查PL/pgSQL语法，确保所有表已创建

### Q5: 连接超时
**A**: 检查网络，Supabase可能需要特殊的网络配置

---

## 📈 监控和维护

### 查看数据库统计

在Supabase Dashboard → **"Database"** → **"Monitoring"**:
- 数据库大小
- 连接数
- 查询性能
- 慢查询日志

### 优化慢查询

```sql
-- 查看慢查询
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 定期维护

```sql
-- 更新表统计信息（每周）
ANALYZE;

-- 清理死元组（每月）
VACUUM;

-- 重建索引（如需要）
REINDEX TABLE users;
```

---

## 🎓 进一步学习

### 官方文档
- [Supabase文档](https://supabase.com/docs)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Row Level Security指南](https://supabase.com/docs/guides/auth/row-level-security)

### 视频教程
- [Supabase快速入门](https://www.youtube.com/watch?v=your-video)
- [PostgreSQL基础](https://www.youtube.com/watch?v=your-video)

---

## ✅ 设置完成清单

部署前确认：

- [ ] ✅ Supabase项目已创建
- [ ] ✅ `001_initial_schema.sql` 执行成功
- [ ] ✅ `002_stored_procedures.sql` 执行成功
- [ ] ✅ 7张表都已创建
- [ ] ✅ RLS策略已启用
- [ ] ✅ 5个存储过程已创建
- [ ] ✅ API密钥已复制
- [ ] ✅ 环境变量已配置
- [ ] ✅ 数据库连接测试成功

---

<div align="center">

## 🎉 数据库设置完成！

现在可以继续部署应用了！

**下一步**: 查看 `QUICK_DEPLOY.md` 进行应用部署

</div>

---

*文档最后更新: 2025-10-12*

