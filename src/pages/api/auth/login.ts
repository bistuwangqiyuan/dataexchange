/**
 * POST /api/auth/login
 * 用户登录
 */

import type { APIRoute } from 'astro';
import { loginUser } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/utils/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validation = loginSchema.safeParse(body);
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

    // 用户登录
    const authResponse = await loginUser(validation.data);

    return new Response(JSON.stringify(successResponse(authResponse)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Login endpoint error', error);
    
    const message = error instanceof Error ? error.message : 'Login failed';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INVALID_CREDENTIALS, message)),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

