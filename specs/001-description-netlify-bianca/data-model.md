# Data Model: 加密货币交易平台

**Feature**: 加密货币在线交易平台  
**Branch**: 001-description-netlify-bianca  
**Version**: 1.0.0  
**Last Updated**: 2025-10-11

---

## 概述 (Overview)

本文档定义了加密货币交易平台的完整数据模型，包括所有实体、关系、约束和索引。数据库使用 **Supabase PostgreSQL**。

---

## 实体关系图 (Entity Relationship Diagram)

```
┌─────────────┐
│   User      │
│  (用户)     │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│   Wallet        │
│  (钱包)         │
└──────┬──────────┘
       │
       │ N
┌──────┴────────────┐
│ WalletTransaction │
│ (钱包历史)        │
└───────────────────┘

┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│   Order         │
│  (订单)         │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────┴───────────┐
│  Transaction     │
│  (成交记录)      │
└──────────────────┘

┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│ SecurityLog     │
│ (安全日志)      │
└─────────────────┘

┌─────────────────┐
│  MarketPrice    │
│  (市场价格)     │
│  (独立表)       │
└─────────────────┘
```

---

## 实体定义 (Entity Definitions)

### 1. User (用户)

**用途**: 存储平台用户的账户信息和配置

**Schema**:

```sql
CREATE TABLE users (
  -- 主键（使用Supabase Auth的UUID）
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 基本信息
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt加密
  username TEXT UNIQUE, -- 可选，用于显示
  
  -- 安全设置
  is_email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- TOTP密钥
  trading_password_hash TEXT, -- 交易密码（6位数字，bcrypt）
  
  -- 偏好设置
  language TEXT DEFAULT 'zh' CHECK (language IN ('zh', 'en')),
  timezone TEXT DEFAULT 'Asia/Shanghai',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  notification_email BOOLEAN DEFAULT TRUE,
  notification_trade BOOLEAN DEFAULT TRUE,
  
  -- 账户状态
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  
  -- 演示账户标识
  is_demo_account BOOLEAN DEFAULT TRUE, -- 所有账户默认为演示
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- 软删除
  deleted_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 自动更新 updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的数据
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 用户只能更新自己的数据（除了status和kyc_status）
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

**验证规则**:
- email: 必须符合邮箱格式
- password: 至少8位，包含字母和数字
- trading_password: 6位数字
- username: 3-20字符，仅字母数字和下划线

**状态转换**:
```
active → suspended (管理员操作或检测到异常)
suspended → active (审核通过)
active/suspended → closed (用户申请注销)
```

---

### 2. Wallet (钱包)

**用途**: 存储用户的各种加密货币余额

**Schema**:

```sql
CREATE TABLE wallets (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 币种信息
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'XRP')),
  
  -- 余额（使用字符串存储，避免精度损失）
  available_balance NUMERIC(30, 18) DEFAULT '0' NOT NULL, -- 可用余额
  frozen_balance NUMERIC(30, 18) DEFAULT '0' NOT NULL,    -- 冻结余额（委托订单占用）
  
  -- 总余额（计算字段，用于快速查询）
  total_balance NUMERIC(30, 18) GENERATED ALWAYS AS (available_balance + frozen_balance) STORED,
  
  -- 充值地址（演示模式下为生成的假地址）
  deposit_address TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：每个用户每种币只有一个钱包
  CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

-- 索引
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);

-- 触发器：自动更新 updated_at
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- 余额约束：不能为负数
ALTER TABLE wallets ADD CONSTRAINT check_available_balance_positive
  CHECK (available_balance >= 0);
  
ALTER TABLE wallets ADD CONSTRAINT check_frozen_balance_positive
  CHECK (frozen_balance >= 0);
```

**验证规则**:
- available_balance >= 0
- frozen_balance >= 0
- 精度：BTC/ETH 18位小数，USDT 6位小数

**初始化**:
```sql
-- 新用户注册时自动创建钱包（通过触发器）
CREATE OR REPLACE FUNCTION create_initial_wallets()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, currency, available_balance, deposit_address)
  VALUES
    (NEW.id, 'BTC', '0.1', 'demo_btc_' || substring(NEW.id::text, 1, 8)),
    (NEW.id, 'ETH', '1.0', 'demo_eth_' || substring(NEW.id::text, 1, 8)),
    (NEW.id, 'USDT', '1000.0', 'demo_usdt_' || substring(NEW.id::text, 1, 8)),
    (NEW.id, 'BNB', '10.0', 'demo_bnb_' || substring(NEW.id::text, 1, 8)),
    (NEW.id, 'ADA', '1000.0', 'demo_ada_' || substring(NEW.id::text, 1, 8)),
    (NEW.id, 'XRP', '1000.0', 'demo_xrp_' || substring(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_wallets
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_wallets();
```

---

### 3. Order (订单)

**用途**: 存储所有交易订单（市价单和限价单）

**Schema**:

```sql
CREATE TABLE orders (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 交易对
  trading_pair TEXT NOT NULL CHECK (trading_pair IN (
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT',
    'ETH/BTC', 'BNB/BTC'
  )),
  
  -- 订单类型
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  
  -- 交易方向
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  
  -- 价格和数量
  price NUMERIC(30, 18), -- 限价单价格（市价单为NULL）
  quantity NUMERIC(30, 18) NOT NULL, -- 订单数量
  filled_quantity NUMERIC(30, 18) DEFAULT '0' NOT NULL, -- 已成交数量
  
  -- 金额
  total_amount NUMERIC(30, 18), -- 订单总金额
  average_filled_price NUMERIC(30, 18), -- 平均成交价格
  
  -- 订单状态
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- 待成交
    'partial_filled', -- 部分成交
    'filled',         -- 完全成交
    'cancelled',      -- 已取消
    'failed'          -- 失败（余额不足等）
  )),
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ, -- 完全成交时间
  cancelled_at TIMESTAMPTZ,
  
  -- 备注
  note TEXT
);

-- 索引
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, order_type);
CREATE INDEX idx_orders_trading_pair ON orders(trading_pair, created_at DESC);
CREATE INDEX idx_orders_pending_limit ON orders(status, order_type, created_at)
  WHERE status IN ('pending', 'partial_filled') AND order_type = 'limit';

-- 触发器
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);
```

**验证规则**:
- quantity > 0
- filled_quantity >= 0 AND filled_quantity <= quantity
- 限价单必须有price
- 市价单price为NULL

**状态转换**:
```
pending → partial_filled (部分成交)
pending → filled (完全成交)
pending → cancelled (用户取消)
pending → failed (余额不足)
partial_filled → filled (剩余部分成交)
partial_filled → cancelled (用户取消)
```

---

### 4. Transaction (成交记录)

**用途**: 记录订单的实际成交明细

**Schema**:

```sql
CREATE TABLE transactions (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联订单
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- 关联用户（冗余，方便查询）
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 成交信息
  executed_price NUMERIC(30, 18) NOT NULL, -- 成交价格
  executed_quantity NUMERIC(30, 18) NOT NULL, -- 成交数量
  executed_amount NUMERIC(30, 18) NOT NULL, -- 成交金额
  
  -- 手续费
  fee NUMERIC(30, 18) NOT NULL DEFAULT '0', -- 手续费
  fee_currency TEXT NOT NULL, -- 手续费币种
  
  -- 成交时间
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_transactions_order ON transactions(order_id, executed_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, executed_at DESC);
CREATE INDEX idx_transactions_executed_at ON transactions(executed_at DESC);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);
```

**计算规则**:
```javascript
// 买入BTC/USDT
executed_amount = executed_price * executed_quantity // USDT
fee = executed_amount * 0.001 // 0.1% (USDT)

// 卖出BTC/USDT
executed_amount = executed_price * executed_quantity // USDT
fee = executed_quantity * 0.001 // 0.1% (BTC)
```

---

### 5. WalletTransaction (钱包历史)

**用途**: 记录钱包的所有资金变动

**Schema**:

```sql
CREATE TABLE wallet_transactions (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 币种
  currency TEXT NOT NULL,
  
  -- 变动类型
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'deposit',      -- 充值
    'withdraw',     -- 提现
    'trade_buy',    -- 交易买入
    'trade_sell',   -- 交易卖出
    'fee',          -- 手续费
    'bonus',        -- 奖励（初始余额）
    'freeze',       -- 冻结（下限价单）
    'unfreeze'      -- 解冻（取消订单）
  )),
  
  -- 金额（正数为增加，负数为减少）
  amount NUMERIC(30, 18) NOT NULL,
  
  -- 余额快照（变动后的余额）
  balance_after NUMERIC(30, 18) NOT NULL,
  
  -- 关联订单（如果是交易相关）
  related_order_id UUID REFERENCES orders(id),
  related_transaction_id UUID REFERENCES transactions(id),
  
  -- 描述
  description TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_transactions_currency ON wallet_transactions(currency, created_at DESC);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);

-- RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

**记录规则**:
- 每次余额变动必须记录
- 记录变动后的余额快照
- 关联相应的订单或成交记录

---

### 6. MarketPrice (市场价格)

**用途**: 缓存市场价格数据（从外部API获取）

**Schema**:

```sql
CREATE TABLE market_prices (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 交易对
  trading_pair TEXT NOT NULL UNIQUE,
  
  -- 价格信息
  current_price NUMERIC(30, 18) NOT NULL,
  high_24h NUMERIC(30, 18),
  low_24h NUMERIC(30, 18),
  open_24h NUMERIC(30, 18),
  
  -- 涨跌幅
  change_24h NUMERIC(10, 4), -- 百分比
  change_amount_24h NUMERIC(30, 18),
  
  -- 交易量
  volume_24h NUMERIC(30, 18),
  volume_24h_quote NUMERIC(30, 18), -- 计价货币交易量
  
  -- 市值
  market_cap NUMERIC(30, 2),
  
  -- 数据来源
  source TEXT DEFAULT 'coingecko', -- coingecko, binance
  
  -- 更新时间
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_market_prices_trading_pair ON market_prices(trading_pair);
CREATE INDEX idx_market_prices_updated_at ON market_prices(updated_at DESC);

-- 自动更新触发器
CREATE TRIGGER set_market_prices_updated_at
  BEFORE UPDATE ON market_prices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- 公开读取（无需认证）
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market prices"
  ON market_prices FOR SELECT
  TO public
  USING (true);
```

**更新策略**:
- Netlify Scheduled Function每10秒调用一次
- 从CoinGecko API获取价格
- 超过15秒未更新视为过期

---

### 7. SecurityLog (安全日志)

**用途**: 记录用户的安全相关操作

**Schema**:

```sql
CREATE TABLE security_logs (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 操作类型
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login',
    'logout',
    'login_failed',
    'password_change',
    'password_reset',
    'trading_password_set',
    'trading_password_change',
    '2fa_enabled',
    '2fa_disabled',
    'email_verified',
    'withdraw_request',
    'withdraw_completed',
    'suspicious_activity'
  )),
  
  -- 操作结果
  result TEXT DEFAULT 'success' CHECK (result IN ('success', 'failed', 'blocked')),
  
  -- 请求信息
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- 地理位置（可选）
  country TEXT,
  city TEXT,
  
  -- 额外数据（JSON）
  metadata JSONB,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX idx_security_logs_action ON security_logs(action_type, created_at DESC);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);

-- RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security logs"
  ON security_logs FOR SELECT
  USING (auth.uid() = user_id);
```

**保留策略**:
- 保留最近90天的日志
- 异常登录日志永久保留

---

## 公共函数 (Database Functions)

### 1. 自动更新时间戳

```sql
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. 余额更新（原子操作）

```sql
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_related_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- 更新余额
  UPDATE wallets
  SET available_balance = available_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency
  RETURNING available_balance INTO v_new_balance;
  
  -- 检查余额是否为负
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- 记录历史
  INSERT INTO wallet_transactions (
    user_id, currency, transaction_type, amount, 
    balance_after, related_order_id, description
  ) VALUES (
    p_user_id, p_currency, p_transaction_type, p_amount,
    v_new_balance, p_related_order_id, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 3. 冻结/解冻余额

```sql
CREATE OR REPLACE FUNCTION freeze_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC,
  p_order_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 从可用余额转移到冻结余额
  UPDATE wallets
  SET available_balance = available_balance - p_amount,
      frozen_balance = frozen_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  
  -- 检查余额
  IF NOT FOUND OR (SELECT available_balance FROM wallets 
                   WHERE user_id = p_user_id AND currency = p_currency) < 0 THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
  
  -- 记录历史
  INSERT INTO wallet_transactions (
    user_id, currency, transaction_type, amount,
    balance_after, related_order_id, description
  )
  SELECT user_id, currency, 'freeze', -p_amount,
         available_balance, p_order_id, 'Frozen for order'
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unfreeze_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC,
  p_order_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 从冻结余额转移回可用余额
  UPDATE wallets
  SET available_balance = available_balance + p_amount,
      frozen_balance = frozen_balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  
  -- 检查冻结余额
  IF (SELECT frozen_balance FROM wallets 
      WHERE user_id = p_user_id AND currency = p_currency) < 0 THEN
    RAISE EXCEPTION 'Invalid frozen balance';
  END IF;
  
  -- 记录历史
  INSERT INTO wallet_transactions (
    user_id, currency, transaction_type, amount,
    balance_after, related_order_id, description
  )
  SELECT user_id, currency, 'unfreeze', p_amount,
         available_balance, p_order_id, 'Unfrozen from cancelled order'
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 数据迁移脚本 (Migration Scripts)

### 初始化脚本

```sql
-- 1. 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建所有表（按依赖顺序）
-- (见上面各实体的CREATE TABLE语句)

-- 3. 创建触发器和函数
-- (见上面的函数定义)

-- 4. 插入初始数据
INSERT INTO market_prices (trading_pair, current_price, high_24h, low_24h, open_24h, change_24h, volume_24h)
VALUES
  ('BTC/USDT', 45000, 46000, 44000, 44500, 1.12, 1500000000),
  ('ETH/USDT', 3000, 3100, 2950, 2980, 0.67, 800000000),
  ('BNB/USDT', 450, 460, 445, 448, 0.45, 200000000),
  ('ADA/USDT', 0.65, 0.68, 0.64, 0.645, 0.78, 50000000),
  ('XRP/USDT', 0.85, 0.88, 0.84, 0.845, 0.59, 80000000);
```

---

## 数据完整性约束 (Data Integrity Constraints)

### 1. 余额一致性
- 钱包余额 = 可用余额 + 冻结余额
- 所有余额变动必须记录到wallet_transactions
- 使用数据库事务保证原子性

### 2. 订单状态一致性
- 已成交数量 <= 订单数量
- 完全成交订单的filled_quantity = quantity
- 取消订单后必须解冻余额

### 3. 成交记录完整性
- 每条transaction必须关联一个order
- transaction的executed_amount = executed_price * executed_quantity

---

## 性能优化建议 (Performance Optimization)

### 1. 索引策略
- 为高频查询字段创建索引
- 使用复合索引优化多条件查询
- 定期ANALYZE和VACUUM

### 2. 分区策略（未来扩展）
```sql
-- 按月份分区历史数据
CREATE TABLE wallet_transactions_2025_01 
PARTITION OF wallet_transactions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 3. 查询优化
- 使用EXPLAIN ANALYZE分析慢查询
- 避免SELECT *，只查询需要的字段
- 使用物化视图缓存复杂聚合

---

## 备份与恢复策略 (Backup & Recovery)

1. **自动备份**: Supabase每日自动备份
2. **手动备份**: 重要操作前手动备份
3. **测试恢复**: 定期测试备份恢复流程
4. **审计日志**: 所有关键操作记录到security_logs

---

## 下一步 (Next Steps)

- ✅ 数据模型设计完成
- ⬜ 生成API合约
- ⬜ 实现数据库迁移脚本
- ⬜ 编写单元测试

