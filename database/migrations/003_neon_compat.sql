-- ============================================
-- Neon 兼容：添加密码字段并移除 Supabase 依赖 (auth.uid())
-- 在 001 + 002 执行后执行本脚本
-- ============================================

-- 1. 为用户表添加密码与 2FA 字段（用于自定义 JWT 认证）
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;

-- 2. 删除所有依赖 auth.uid() 的 RLS 策略
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS wallets_select_own ON wallets;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;
DROP POLICY IF EXISTS wallets_update_own ON wallets;
DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_insert_own ON orders;
DROP POLICY IF EXISTS orders_update_own ON orders;
DROP POLICY IF EXISTS transactions_select_own ON transactions;
DROP POLICY IF EXISTS transactions_insert_own ON transactions;
DROP POLICY IF EXISTS wallet_transactions_select_own ON wallet_transactions;
DROP POLICY IF EXISTS wallet_transactions_insert_own ON wallet_transactions;
DROP POLICY IF EXISTS market_prices_select_all ON market_prices;
DROP POLICY IF EXISTS security_logs_select_own ON security_logs;
DROP POLICY IF EXISTS security_logs_insert_own ON security_logs;

-- 3. 关闭 RLS，由应用层校验用户身份
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
