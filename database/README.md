# 数据库配置

## 快速开始

### 1. 在 Supabase 中执行迁移

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制 `migrations/001_initial_schema.sql` 的全部内容
5. 粘贴到 SQL Editor 并点击 **Run**

### 2. 验证表结构

执行以下查询验证表已创建：

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

应该看到 7 张表：
- `users`
- `wallets`
- `orders`
- `transactions`
- `wallet_transactions`
- `market_prices`
- `security_logs`

### 3. 验证 RLS 策略

```sql
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

所有表的 `rowsecurity` 应该为 `true`。

## 数据模型

### 核心实体关系

```
users (用户)
  ↓ 1:N
wallets (钱包)
  ↓
wallet_transactions (钱包交易)

users (用户)
  ↓ 1:N
orders (订单)
  ↓ 1:N
transactions (成交记录)

users (用户)
  ↓ 1:N
security_logs (安全日志)

market_prices (市场行情) - 独立表
```

### 表说明

#### 1. users - 用户表
- 存储用户基本信息
- 与 Supabase Auth 集成
- RLS: 用户只能查看/更新自己的信息

#### 2. wallets - 钱包表
- 多币种资产管理
- `balance`: 总余额
- `frozen`: 冻结金额（下单时）
- 约束: `balance >= frozen >= 0`
- RLS: 用户只能访问自己的钱包

#### 3. orders - 订单表
- 支持市价单和限价单
- 订单状态: pending, filled, cancelled, partial
- `filled_quantity`: 已成交数量
- RLS: 用户只能管理自己的订单

#### 4. transactions - 成交记录表
- 记录每笔交易的详细信息
- 包含价格、数量、手续费、总额
- 只能插入，不可修改（审计日志）
- RLS: 用户只能查看自己的成交

#### 5. wallet_transactions - 钱包交易记录
- 充值/提现记录
- 状态: pending, completed, failed
- RLS: 用户只能查看自己的记录

#### 6. market_prices - 市场行情
- 存储行情快照
- 来源: CoinGecko, Binance
- RLS: 公开数据，所有人可读

#### 7. security_logs - 安全日志
- 记录用户安全相关事件
- 登录/登出、订单操作等
- RLS: 用户只能查看自己的日志

## 数据库函数

### get_available_balance()
获取用户某币种的可用余额（总余额 - 冻结金额）

```sql
SELECT get_available_balance('user-uuid', 'USDT');
```

### log_security_event()
记录安全事件

```sql
SELECT log_security_event(
  'user-uuid',
  'login',
  '127.0.0.1'::inet,
  'Mozilla/5.0...',
  '{"success": true}'::jsonb
);
```

## 索引策略

所有表都创建了必要的索引以优化查询性能：

- **user_id**: 快速查找用户相关数据
- **trading_pair**: 交易对筛选
- **created_at**: 按时间排序（降序）
- **status**: 订单状态筛选

## RLS 安全策略

### 核心原则
1. **最小权限**: 用户只能访问自己的数据
2. **公开数据**: 市场行情对所有人可读
3. **审计日志**: 成交记录只能插入，不可修改

### 策略列表

| 表 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| users | ✅ 仅自己 | ❌ 由 Auth 处理 | ✅ 仅自己 | ❌ |
| wallets | ✅ 仅自己 | ✅ 仅自己 | ✅ 仅自己 | ❌ |
| orders | ✅ 仅自己 | ✅ 仅自己 | ✅ 仅自己 | ❌ |
| transactions | ✅ 仅自己 | ✅ 仅自己 | ❌ | ❌ |
| wallet_transactions | ✅ 仅自己 | ✅ 仅自己 | ❌ | ❌ |
| market_prices | ✅ 所有人 | ❌ Service Role | ❌ | ❌ |
| security_logs | ✅ 仅自己 | ✅ 仅自己 | ❌ | ❌ |

## 数据完整性

### 约束
- ✅ 所有金额字段 >= 0
- ✅ `balance >= frozen` (钱包)
- ✅ `filled_quantity <= quantity` (订单)
- ✅ 限价单必须有价格
- ✅ 市价单价格为 NULL

### 触发器
- ✅ 自动更新 `updated_at` 字段
- ✅ 级联删除（用户删除时删除关联数据）

## 测试查询

### 创建测试用户钱包
```sql
-- 假设用户ID为 'user-uuid'
INSERT INTO wallets (user_id, currency, balance, frozen)
VALUES ('user-uuid', 'USDT', 10000.00, 0);

INSERT INTO wallets (user_id, currency, balance, frozen)
VALUES ('user-uuid', 'BTC', 0.5, 0);
```

### 查询用户余额
```sql
SELECT 
  currency,
  balance,
  frozen,
  balance - frozen AS available
FROM wallets
WHERE user_id = 'user-uuid';
```

### 查询订单历史
```sql
SELECT 
  trading_pair,
  order_type,
  side,
  price,
  quantity,
  filled_quantity,
  status,
  created_at
FROM orders
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

## 备份和恢复

### 自动备份
Supabase 提供自动每日备份（需付费计划）。

### 手动导出
```bash
# 使用 pg_dump
pg_dump --host=db.xxx.supabase.co \
        --port=5432 \
        --username=postgres \
        --dbname=postgres \
        --file=backup.sql
```

### 恢复
```bash
# 使用 psql
psql --host=db.xxx.supabase.co \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --file=backup.sql
```

## 性能优化建议

1. **定期清理历史数据**
   ```sql
   -- 删除1年前的市场行情
   DELETE FROM market_prices 
   WHERE created_at < NOW() - INTERVAL '1 year';
   ```

2. **分析查询性能**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM orders 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC 
   LIMIT 50;
   ```

3. **监控慢查询**
   - Supabase Dashboard → Reports → Query Performance

## 故障排查

### 问题: RLS 阻止数据访问
**解决**: 检查用户是否已认证
```sql
SELECT auth.uid(); -- 应返回用户UUID
```

### 问题: 约束违反
**解决**: 检查数据是否满足约束条件
```sql
-- 查看表约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'wallets'::regclass;
```

### 问题: 性能慢
**解决**: 检查索引使用情况
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## 下一步

1. ✅ 运行迁移脚本
2. ✅ 验证表结构和 RLS
3. ✅ 配置应用环境变量
4. ✅ 测试 Supabase 连接
5. ✅ 部署应用到 Netlify

参考文档：
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

