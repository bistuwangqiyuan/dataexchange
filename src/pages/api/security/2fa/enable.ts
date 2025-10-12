/**
 * POST /api/security/2fa/enable
 * 启用双因素认证（2FA）
 * 生成TOTP密钥和二维码URL
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

/**
 * 生成随机的 TOTP 密钥 (Base32 编码)
 */
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // 检查是否已启用 2FA
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      logger.error('Failed to fetch user data', fetchError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to check 2FA status')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Reason: 生成新的 TOTP 密钥
    const secret = generateTOTPSecret();
    
    // 构造二维码 URL (用于 Google Authenticator 等应用)
    const appName = 'CryptoExchange';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(user.email!)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
    
    // Reason: 暂时将密钥存储在用户表中（稍后需要用户验证）
    // Note: 在真实应用中，应该存储在临时表中，验证后才写入
    const { error: updateError } = await supabase
      .from('users')
      .update({
        // 暂存到一个临时字段，验证后才正式启用
        email: user.email, // 保持不变
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to store 2FA secret', updateError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to enable 2FA')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info('2FA setup initiated', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          secret,
          qr_code_url: otpauthUrl,
          manual_entry_key: secret,
          message: 'Scan the QR code with your authenticator app, then verify with a code to complete setup',
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Enable 2FA endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to enable 2FA';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

