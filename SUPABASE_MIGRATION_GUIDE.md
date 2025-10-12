# Supabase 数据库迁移指南

## 项目信息

- **Supabase URL**: `https://zzyueuweeoakopuuwfau.supabase.co`
- **Supabase Anon Key**: 已配置（见环境变量）
- **项目ID**: `zzyueuweeoakopuuwfau`

## 迁移步骤

### 1. 访问 Supabase SQL Editor

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`zzyueuweeoakopuuwfau`
3. 点击左侧导航栏的 **SQL Editor**

### 2. 执行迁移脚本

将 `database/migrations/001_initial_schema.sql` 文件的内容复制到 SQL Editor 中，然后点击 **Run** 按钮执行。

该脚本将创建以下内容：

#### 数据表（8张）
- `users` - 用户表
- `wallets` - 钱包表
- `orders` - 订单表
- `transactions` - 成交记录表
- `wallet_transactions` - 钱包交易记录表
- `market_prices` - 市场行情表
- `security_logs` - 安全日志表

#### 安全功能
- ✅ Row Level Security (RLS) 已启用
- ✅ 用户数据隔离策略已配置
- ✅ 市场数据公开访问策略

#### 索引优化
- ✅ 用户查询索引
- ✅ 订单交易索引
- ✅ 时间序列索引

#### 数据库函数
- `get_available_balance()` - 获取用户可用余额
- `log_security_event()` - 记录安全事件
- `update_updated_at_column()` - 自动更新时间戳

#### 测试数据
脚本会插入3条市场行情测试数据（BTC/USDT、ETH/USDT、BNB/USDT）

### 3. 验证迁移

执行以下 SQL 查询验证表是否创建成功：

```sql
-- 查看所有表
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'wallets', 'orders', 'transactions',
    'wallet_transactions', 'market_prices', 'security_logs'
  )
ORDER BY tablename;

-- 验证 RLS 是否启用
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'wallets', 'orders', 'transactions',
    'wallet_transactions', 'market_prices', 'security_logs'
  );

-- 查看示例数据
SELECT * FROM market_prices LIMIT 5;
```

### 4. 获取 Service Role Key（重要！）

1. 在 Supabase Dashboard 中，点击 **Settings** → **API**
2. 找到 **Project API keys** 部分
3. 复制 **service_role** key（⚠️ 保密！仅用于服务端）
4. 将该 key 添加到 Netlify 环境变量中：`SUPABASE_SERVICE_ROLE_KEY`

## 常见问题

### Q: 迁移脚本执行失败？
**A**: 检查错误信息：
- 如果提示表已存在，可以先删除旧表或修改脚本使用 `DROP TABLE IF EXISTS`
- 如果提示权限问题，确认你有项目的管理员权限

### Q: RLS 策略是否正常工作？
**A**: 在 Supabase Dashboard 的 **Authentication** → **Policies** 中查看所有 RLS 策略

### Q: 如何重置数据库？
**A**: ⚠️ **警告：这将删除所有数据！**

```sql
-- 删除所有表（按依赖顺序）
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

然后重新执行迁移脚本。

## 下一步

✅ 迁移完成后，继续执行 Netlify 部署流程

