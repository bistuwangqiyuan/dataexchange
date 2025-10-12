/**
 * Auth Service
 * 
 * 处理用户认证相关业务逻辑
 */

import { createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api.types';

/**
 * 用户注册
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const supabase = createServerClient();

  logger.info('Registering new user', { email: data.email });

  // 创建用户账号
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    logger.error('Registration failed', authError);
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Registration failed: No user data returned');
  }

  // 如果启用了邮箱确认，session可能为null
  if (!authData.session) {
    logger.info('User registered, email confirmation required', { userId: authData.user.id });
    throw new Error('Registration successful! Please check your email to confirm your account before logging in.');
  }

  logger.info('User registered successfully', { userId: authData.user.id });

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      is_verified: authData.user.confirmed_at !== null,
    },
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at!,
    },
  };
}

/**
 * 用户登录
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const supabase = createServerClient();

  logger.info('User login attempt', { email: data.email });

  // 登录
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    logger.error('Login failed', authError);
    throw new Error(authError.message);
  }

  if (!authData.user || !authData.session) {
    throw new Error('Login failed: No user data returned');
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', authData.user.id);

  logger.info('User logged in successfully', { userId: authData.user.id });

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      is_verified: authData.user.confirmed_at !== null,
    },
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at!,
    },
  };
}

/**
 * 用户登出
 */
export async function logoutUser(): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error('Logout failed', error);
    throw new Error(error.message);
  }

  logger.info('User logged out');
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const supabase = createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logger.error('Get current user failed', error);
    return null;
  }

  return user;
}

/**
 * 验证用户是否已登录
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: Please login');
  }

  return user;
}

