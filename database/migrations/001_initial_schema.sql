-- ============================================
-- 加密货币交易平台 - 数据库迁移脚本
-- Version: 1.0.0
-- Date: 2025-01-12
-- ============================================

-- 1. 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 3. 创建钱包表
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance DECIMAL(36, 18) DEFAULT 0 CHECK (balance >= 0),
  frozen DECIMAL(36, 18) DEFAULT 0 CHECK (frozen >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, currency),
  CONSTRAINT balance_frozen_check CHECK (balance >= frozen)
);

-- 4. 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_pair TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  price DECIMAL(36, 18),
  quantity DECIMAL(36, 18) NOT NULL CHECK (quantity > 0),
  filled_quantity DECIMAL(36, 18) DEFAULT 0 CHECK (filled_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT price_required_for_limit CHECK (
    (order_type = 'market' AND price IS NULL) OR 
    (order_type = 'limit' AND price IS NOT NULL AND price > 0)
  ),
  CONSTRAINT filled_quantity_check CHECK (filled_quantity <= quantity)
);

-- 5. 创建成交记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_pair TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  price DECIMAL(36, 18) NOT NULL CHECK (price > 0),
  quantity DECIMAL(36, 18) NOT NULL CHECK (quantity > 0),
  fee DECIMAL(36, 18) NOT NULL CHECK (fee >= 0),
  total DECIMAL(36, 18) NOT NULL CHECK (total > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建钱包交易记录表
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  currency TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建市场行情表
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trading_pair TEXT NOT NULL,
  price DECIMAL(36, 18) NOT NULL CHECK (price > 0),
  volume_24h DECIMAL(36, 18) NOT NULL CHECK (volume_24h >= 0),
  change_24h DECIMAL(10, 4) NOT NULL,
  high_24h DECIMAL(36, 18) NOT NULL CHECK (high_24h >= 0),
  low_24h DECIMAL(36, 18) NOT NULL CHECK (low_24h >= 0),
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建安全日志表
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_change', 'order_placed', 'order_cancelled')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 创建索引
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_trading_pair ON orders(trading_pair);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trading_pair ON transactions(trading_pair);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Wallet Transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Market Prices
CREATE INDEX IF NOT EXISTS idx_market_prices_trading_pair ON market_prices(trading_pair);
CREATE INDEX IF NOT EXISTS idx_market_prices_created_at ON market_prices(created_at DESC);

-- Security Logs
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

-- ============================================
-- 创建触发器函数
-- ============================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器（先删除已存在的）
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 启用 Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建 RLS 策略（先删除已存在的）
-- ============================================

-- Users: 用户只能查看和更新自己的信息
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Wallets: 用户只能查看自己的钱包
DROP POLICY IF EXISTS wallets_select_own ON wallets;
CREATE POLICY wallets_select_own ON wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS wallets_insert_own ON wallets;
CREATE POLICY wallets_insert_own ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS wallets_update_own ON wallets;
CREATE POLICY wallets_update_own ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders: 用户只能查看和管理自己的订单
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS orders_insert_own ON orders;
CREATE POLICY orders_insert_own ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS orders_update_own ON orders;
CREATE POLICY orders_update_own ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: 用户只能查看自己的成交记录
DROP POLICY IF EXISTS transactions_select_own ON transactions;
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS transactions_insert_own ON transactions;
CREATE POLICY transactions_insert_own ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallet Transactions: 用户只能查看自己的钱包交易
DROP POLICY IF EXISTS wallet_transactions_select_own ON wallet_transactions;
CREATE POLICY wallet_transactions_select_own ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS wallet_transactions_insert_own ON wallet_transactions;
CREATE POLICY wallet_transactions_insert_own ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Market Prices: 所有人可读（公开数据）
DROP POLICY IF EXISTS market_prices_select_all ON market_prices;
CREATE POLICY market_prices_select_all ON market_prices
  FOR SELECT TO authenticated, anon USING (true);

-- Security Logs: 用户只能查看自己的日志
DROP POLICY IF EXISTS security_logs_select_own ON security_logs;
CREATE POLICY security_logs_select_own ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS security_logs_insert_own ON security_logs;
CREATE POLICY security_logs_insert_own ON security_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 创建数据库函数
-- ============================================

-- 函数：获取用户可用余额
CREATE OR REPLACE FUNCTION get_available_balance(
  p_user_id UUID,
  p_currency TEXT
)
RETURNS DECIMAL(36, 18) AS $$
DECLARE
  v_balance DECIMAL(36, 18);
  v_frozen DECIMAL(36, 18);
BEGIN
  SELECT balance, frozen INTO v_balance, v_frozen
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency;
  
  IF v_balance IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN v_balance - v_frozen;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：记录安全日志
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 插入测试数据（可选）
-- ============================================

-- 注意：实际部署时删除此部分或通过单独的脚本执行

-- 示例市场行情数据
INSERT INTO market_prices (trading_pair, price, volume_24h, change_24h, high_24h, low_24h, source)
VALUES 
  ('BTC/USDT', 45000.00, 1250000000, 2.5, 46000.00, 44000.00, 'CoinGecko'),
  ('ETH/USDT', 2500.00, 850000000, 1.8, 2550.00, 2450.00, 'CoinGecko'),
  ('BNB/USDT', 350.00, 125000000, -0.5, 360.00, 345.00, 'CoinGecko')
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成
-- ============================================

-- 验证表创建
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 显示成功消息
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库迁移完成！';
  RAISE NOTICE '📊 已创建 7 张表';
  RAISE NOTICE '🔐 已启用 RLS 策略';
  RAISE NOTICE '⚡ 已创建索引和触发器';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '1. 配置环境变量（.env文件）';
  RAISE NOTICE '2. 测试 Supabase 连接';
  RAISE NOTICE '3. 部署到 Netlify';
END $$;

