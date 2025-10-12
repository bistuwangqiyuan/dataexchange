/**
 * Logger Utility
 * 
 * 统一的日志记录工具
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    // 兼容浏览器环境(import.meta.env)和Node.js环境(process.env)
    const nodeEnv = typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.NODE_ENV
      : process.env.NODE_ENV;
    this.isDevelopment = nodeEnv === 'development';
  }

  /**
   * 格式化日志消息
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug 级别日志（仅开发环境）
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.format('debug', message, context));
    }
  }

  /**
   * Info 级别日志
   */
  info(message: string, context?: LogContext): void {
    console.log(this.format('info', message, context));
  }

  /**
   * Warning 级别日志
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context));
  }

  /**
   * Error 级别日志
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    };
    console.error(this.format('error', message, errorContext));
  }

  /**
   * 记录 API 请求
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context);
  }

  /**
   * 记录 API 响应
   */
  apiResponse(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API ${method} ${path} - ${status} (${duration}ms)`, context);
  }

  /**
   * 记录数据库查询
   */
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}`, context);
  }

  /**
   * 记录安全事件
   */
  security(event: string, context?: LogContext): void {
    this.warn(`SECURITY: ${event}`, context);
  }
}

/**
 * 导出单例实例
 */
export const logger = new Logger();

