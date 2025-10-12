/**
 * API Request/Response Types
 * 
 * 对应 contracts/api-specification.yaml 中定义的 API 接口
 */

import type { OrderType, OrderSide, OrderStatus } from './database.types';

/**
 * 通用API响应包装
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Auth API Types
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    is_verified: boolean;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Market API Types
 */
export interface MarketTicker {
  trading_pair: string;
  price: string;
  volume_24h: string;
  change_24h: string;
  high_24h: string;
  low_24h: string;
  last_updated: string;
}

export interface OrderBook {
  trading_pair: string;
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  timestamp: string;
}

export interface Trade {
  id: string;
  trading_pair: string;
  price: string;
  quantity: string;
  side: OrderSide;
  timestamp: string;
}

/**
 * Wallet API Types
 */
export interface WalletBalance {
  currency: string;
  balance: string;
  frozen: string;
  available: string;
}

export interface DepositRequest {
  currency: string;
  amount: string;
}

export interface WithdrawRequest {
  currency: string;
  amount: string;
  address?: string; // 模拟模式下可选
}

export interface TransactionHistory {
  id: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Order API Types
 */
export interface CreateOrderRequest {
  trading_pair: string;
  order_type: OrderType;
  side: OrderSide;
  price?: string; // Limit order only
  quantity: string;
}

export interface OrderResponse {
  id: string;
  user_id: string;
  trading_pair: string;
  order_type: OrderType;
  side: OrderSide;
  price: string | null;
  quantity: string;
  filled_quantity: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderHistoryQuery {
  trading_pair?: string;
  status?: OrderStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * User API Types
 */
export interface UserProfile {
  id: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface UpdateProfileRequest {
  email?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

/**
 * Error Codes
 */
export enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  
  // Trading
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_TRADING_PAIR = 'INVALID_TRADING_PAIR',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  CANNOT_CANCEL_ORDER = 'CANNOT_CANCEL_ORDER',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

