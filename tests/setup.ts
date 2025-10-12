/**
 * Vitest Setup File
 * 测试环境初始化配置
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// 全局测试配置
beforeAll(() => {
  // 测试前的全局设置
  console.log('Starting test suite...');
});

afterAll(() => {
  // 测试后的清理
  console.log('Test suite completed.');
});

afterEach(() => {
  // 每个测试后的清理
});

// 环境变量模拟
process.env.PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NODE_ENV = 'test';

