/**
 * Netlify Scheduled Function
 * 
 * 定时检查并执行待成交的限价单
 * Schedule: 每分钟执行一次
 * 
 * 注意：Netlify Scheduled Functions 使用标准 5 字段 cron 格式
 * 格式: minute hour day month day_of_week
 * 最小间隔为 1 分钟
 */

import { schedule } from '@netlify/functions';
import { matchLimitOrders } from '../../src/lib/services/order-matching.service';
import { logger } from '../../src/lib/utils/logger';

/**
 * 定时任务处理函数
 * Cron: * * * * * (每分钟执行一次)
 * 格式: 分钟 小时 日期 月份 星期
 */
const handler = schedule('* * * * *', async () => {
  try {
    logger.info('Starting scheduled limit order matching');

    const result = await matchLimitOrders();

    logger.info('Scheduled order matching completed', {
      matched: result.matched,
      failed: result.failed,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        matched: result.matched,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    logger.error('Scheduled order matching failed', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
});

export { handler };

