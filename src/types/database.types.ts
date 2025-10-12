/**
 * Database Types - Generated from Supabase Schema
 * 
 * 这些类型对应 data-model.md 中定义的数据库表结构
 */

export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'partial';
export type OrderType = 'market' | 'limit';
export type OrderSide = 'buy' | 'sell';
export type TransactionType = 'buy' | 'sell';
export type WalletTransactionType = 'deposit' | 'withdrawal';
export type SecurityEventType = 
  | 'login' 
  | 'logout' 
  | 'failed_login' 
  | 'password_change' 
  | 'order_placed' 
  | 'order_cancelled';

/**
 * User 表
 * 用户基础信息和认证
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  last_login_at: string | null;
}

/**
 * Wallet 表
 * 用户钱包资产
 */
export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: string; // Decimal as string
  frozen: string; // Decimal as string
  created_at: string;
  updated_at: string;
}

/**
 * Order 表
 * 交易订单
 */
export interface Order {
  id: string;
  user_id: string;
  trading_pair: string;
  order_type: OrderType;
  side: OrderSide;
  price: string | null; // Decimal as string (null for market orders)
  quantity: string; // Decimal as string
  filled_quantity: string; // Decimal as string
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Transaction 表
 * 成交记录
 */
export interface Transaction {
  id: string;
  order_id: string;
  user_id: string;
  trading_pair: string;
  type: TransactionType;
  price: string; // Decimal as string
  quantity: string; // Decimal as string
  fee: string; // Decimal as string
  total: string; // Decimal as string
  created_at: string;
}

/**
 * WalletTransaction 表
 * 钱包充值/提现记录
 */
export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: WalletTransactionType;
  currency: string;
  amount: string; // Decimal as string
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * MarketPrice 表
 * 市场行情快照
 */
export interface MarketPrice {
  id: string;
  trading_pair: string;
  price: string; // Decimal as string
  volume_24h: string; // Decimal as string
  change_24h: string; // Decimal as string (percentage)
  high_24h: string; // Decimal as string
  low_24h: string; // Decimal as string
  source: string;
  created_at: string;
}

/**
 * SecurityLog 表
 * 安全日志
 */
export interface SecurityLog {
  id: string;
  user_id: string;
  event_type: SecurityEventType;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Database Schema
 * Supabase 数据库完整类型定义
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'created_at' | 'updated_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: never;
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: Omit<WalletTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WalletTransaction, 'id' | 'created_at' | 'updated_at'>>;
      };
      market_prices: {
        Row: MarketPrice;
        Insert: Omit<MarketPrice, 'id' | 'created_at'>;
        Update: never;
      };
      security_logs: {
        Row: SecurityLog;
        Insert: Omit<SecurityLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}

