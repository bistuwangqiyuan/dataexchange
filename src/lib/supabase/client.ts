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
 * 兼容浏览器环境(import.meta.env)和Node.js环境(process.env)
 */
function getPublicEnv() {
  // 在浏览器环境使用 import.meta.env，在服务器环境使用 process.env
  const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.PUBLIC_SUPABASE_URL 
    : process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    : process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check .env file.'
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
  const serviceRoleKey = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

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
 */
export const supabase = createBrowserClient();

