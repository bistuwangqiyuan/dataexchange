/**
 * POST /api/auth/register
 * 用户注册
 */

import type { APIRoute } from 'astro';
import { registerUser } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/utils/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      validation.error.errors.forEach(err => {
        const key = err.path.join('.');
        if (!errors[key]) errors[key] = [];
        errors[key].push(err.message);
      });
      return new Response(JSON.stringify(validationErrorResponse(errors)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 注册用户
    const authResponse = await registerUser(validation.data);

    return new Response(JSON.stringify(successResponse(authResponse)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Register endpoint error', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    const isEmailExists = message.includes('already registered') || message.includes('Email already');
    return new Response(
      JSON.stringify(errorResponse(isEmailExists ? ErrorCode.EMAIL_ALREADY_EXISTS : ErrorCode.INTERNAL_ERROR, message)),
      { status: isEmailExists ? 400 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

