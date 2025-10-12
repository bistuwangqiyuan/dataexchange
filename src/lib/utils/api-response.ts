/**
 * API Response Utilities
 * 
 * 统一的 API 响应格式处理
 */

import type { ApiResponse, ErrorCode } from '@/types/api.types';

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建错误响应
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建验证错误响应
 */
export function validationErrorResponse(errors: Record<string, string[]>): ApiResponse {
  return errorResponse('INVALID_INPUT', 'Validation failed', { errors });
}

/**
 * 创建未授权错误响应
 */
export function unauthorizedResponse(message = 'Unauthorized'): ApiResponse {
  return errorResponse('UNAUTHORIZED', message);
}

/**
 * 创建未找到错误响应
 */
export function notFoundResponse(resource: string): ApiResponse {
  return errorResponse('NOT_FOUND', `${resource} not found`);
}

/**
 * 创建内部错误响应
 */
export function internalErrorResponse(message = 'Internal server error'): ApiResponse {
  return errorResponse('INTERNAL_ERROR', message);
}

/**
 * 创建速率限制错误响应
 */
export function rateLimitResponse(): ApiResponse {
  return errorResponse(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests, please try again later'
  );
}

/**
 * 包装异步函数，自动处理错误
 */
export async function handleApiRequest<T>(
  handler: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await handler();
    return successResponse(data);
  } catch (error) {
    console.error('API request error:', error);

    if (error instanceof Error) {
      return internalErrorResponse(error.message);
    }

    return internalErrorResponse();
  }
}

