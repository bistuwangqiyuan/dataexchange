-- ============================================
-- 存储过程和函数 - 加密货币交易平台
-- Version: 1.0.0
-- Date: 2025-10-12
-- Purpose: 原子操作函数，用于订单处理和余额管理
-- ============================================

-- 1. 执行市价单
CREATE OR REPLACE FUNCTION execute_market_order(
  p_order_id UUID,
  p_user_id UUID,
  p_trading_pair TEXT,
  p_side TEXT,
  p_price NUMERIC,
  p_quantity NUMERIC,
  p_fee NUMERIC,
  p_total NUMERIC,
  p_base_currency TEXT,
  p_quote_currency TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Reason: 使用事务确保原子性
  
  -- 1. 更新订单状态为已完成
  UPDATE orders
  SET status = 'filled',
      filled_quantity = p_quantity,
      updated_at = NOW()
  WHERE id = p_order_id AND user_id = p_user_id;
  
  -- 2. 创建成交记录
  INSERT INTO transactions (
    order_id, user_id, trading_pair, type,
    price, quantity, fee, total
  )
  VALUES (
    p_order_id, p_user_id, p_trading_pair, p_side,
    p_price, p_quantity, p_fee, p_total
  )
  RETURNING id INTO v_transaction_id;
  
  -- 3. 更新钱包余额
  IF p_side = 'buy' THEN
    -- 买入：扣除quote币种（如USDT），增加base币种（如BTC）
    -- 扣除USDT（含手续费）
    UPDATE wallets
    SET balance = balance - (p_total + p_fee),
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_quote_currency;
    
    -- 增加BTC
    UPDATE wallets
    SET balance = balance + p_quantity,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_base_currency;
    
    -- 记录钱包变动
    INSERT INTO wallet_transactions (wallet_id, user_id, type, currency, amount, status)
    SELECT id, p_user_id, 'deposit', p_base_currency, p_quantity, 'completed'
    FROM wallets
    WHERE user_id = p_user_id AND currency = p_base_currency;
    
  ELSE
    -- 卖出：扣除base币种（如BTC），增加quote币种（如USDT）
    -- 扣除BTC（含手续费）
    UPDATE wallets
    SET balance = balance - (p_quantity + p_fee),
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_base_currency;
    
    -- 增加USDT
    UPDATE wallets
    SET balance = balance + p_total,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_quote_currency;
    
    -- 记录钱包变动
    INSERT INTO wallet_transactions (wallet_id, user_id, type, currency, amount, status)
    SELECT id, p_user_id, 'deposit', p_quote_currency, p_total, 'completed'
    FROM wallets
    WHERE user_id = p_user_id AND currency = p_quote_currency;
  END IF;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 执行限价单
CREATE OR REPLACE FUNCTION execute_limit_order(
  p_order_id UUID,
  p_user_id UUID,
  p_trading_pair TEXT,
  p_side TEXT,
  p_price NUMERIC,
  p_quantity NUMERIC,
  p_fee NUMERIC,
  p_total NUMERIC,
  p_base_currency TEXT,
  p_quote_currency TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- 1. 更新订单状态
  UPDATE orders
  SET status = 'filled',
      filled_quantity = p_quantity,
      updated_at = NOW()
  WHERE id = p_order_id AND user_id = p_user_id;
  
  -- 2. 创建成交记录
  INSERT INTO transactions (
    order_id, user_id, trading_pair, type,
    price, quantity, fee, total
  )
  VALUES (
    p_order_id, p_user_id, p_trading_pair, p_side,
    p_price, p_quantity, p_fee, p_total
  )
  RETURNING id INTO v_transaction_id;
  
  -- 3. 解冻并更新余额
  IF p_side = 'buy' THEN
    -- 买入限价单：解冻USDT，扣除实际金额，增加BTC
    UPDATE wallets
    SET frozen = frozen - (p_total + p_fee),
        balance = balance - (p_total + p_fee),
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_quote_currency;
    
    UPDATE wallets
    SET balance = balance + p_quantity,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_base_currency;
    
  ELSE
    -- 卖出限价单：解冻BTC，扣除实际数量，增加USDT
    UPDATE wallets
    SET frozen = frozen - (p_quantity + p_fee),
        balance = balance - (p_quantity + p_fee),
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_base_currency;
    
    UPDATE wallets
    SET balance = balance + p_total,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_quote_currency;
  END IF;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 冻结余额
CREATE OR REPLACE FUNCTION freeze_wallet_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_balance NUMERIC;
BEGIN
  -- 检查可用余额
  SELECT balance - frozen INTO v_available_balance
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
  
  -- 冻结余额
  UPDATE wallets
  SET frozen = frozen + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. 解冻余额
CREATE OR REPLACE FUNCTION unfreeze_wallet_balance(
  p_user_id UUID,
  p_currency TEXT,
  p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 解冻余额
  UPDATE wallets
  SET frozen = frozen - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  
  -- 检查冻结余额是否为负
  IF (SELECT frozen FROM wallets WHERE user_id = p_user_id AND currency = p_currency) < 0 THEN
    RAISE EXCEPTION 'Invalid frozen balance';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. 取消订单
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_frozen_amount NUMERIC;
  v_currency TEXT;
BEGIN
  -- 获取订单信息
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF v_order.status NOT IN ('pending', 'partial') THEN
    RAISE EXCEPTION 'Cannot cancel order with status %', v_order.status;
  END IF;
  
  -- 计算需要解冻的金额
  v_frozen_amount := v_order.quantity - v_order.filled_quantity;
  
  -- 确定币种
  IF v_order.side = 'buy' THEN
    -- 买单解冻计价币种
    v_currency := split_part(v_order.trading_pair, '/', 2);
    v_frozen_amount := v_frozen_amount * COALESCE(v_order.price, 0);
  ELSE
    -- 卖单解冻基础币种
    v_currency := split_part(v_order.trading_pair, '/', 1);
  END IF;
  
  -- 解冻余额
  IF v_frozen_amount > 0 THEN
    PERFORM unfreeze_wallet_balance(p_user_id, v_currency, v_frozen_amount);
  END IF;
  
  -- 更新订单状态
  UPDATE orders
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 完成
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 存储过程创建完成！';
  RAISE NOTICE '📊 已创建5个函数：';
  RAISE NOTICE '  - execute_market_order';
  RAISE NOTICE '  - execute_limit_order';
  RAISE NOTICE '  - freeze_wallet_balance';
  RAISE NOTICE '  - unfreeze_wallet_balance';
  RAISE NOTICE '  - cancel_order';
END $$;

