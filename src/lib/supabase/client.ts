/**
 * Supabase Client
 * 
 * 为浏览器和服务器环境提供 Supabase 客户端实例
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * 获取公共环境变量
 * 这些变量在客户端和服务器都可用
 * 优先使用 process.env (兼容Netlify Functions)
 */
function getPublicEnv() {
  // 优先使用 process.env，确保在所有环境中都能正常工作
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check .env file and Netlify environment settings.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * 创建浏览器端 Supabase 客户端
 * 使用 anon key，具有 RLS 安全保护
 */
export function createBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * 创建服务器端 Supabase 客户端（使用 anon key）
 * 用于 API 路由和服务器端渲染
 */
export function createServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * 创建服务器端 Supabase 管理客户端（使用 service role key）
 * ⚠️ 警告：仅用于后端函数，具有完全权限，绕过 RLS
 */
export function createAdminClient() {
  const { supabaseUrl } = getPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for admin operations.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * 默认导出浏览器客户端（用于组件）
 * 使用懒加载，避免在服务器端初始化时出错
 */
let _browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserClient() {
  if (typeof window === 'undefined') {
    // 在服务器端，返回服务器客户端
    return createServerClient();
  }
  if (_browserClient) return _browserClient;
  _browserClient = createBrowserClient();
  return _browserClient;
}

// 不在模块级别初始化，避免SSR时立即执行
// 组件中应该使用 getBrowserClient() 而不是直接使用 supabase
export const supabase = {
  get auth() { return getBrowserClient().auth; },
  get from() { return getBrowserClient().from.bind(getBrowserClient()); },
  get storage() { return getBrowserClient().storage; },
  get functions() { return getBrowserClient().functions; },
  get realtime() { return getBrowserClient().realtime; },
  get channel() { return getBrowserClient().channel.bind(getBrowserClient()); },
};

