/**
 * Netlify Scheduled Function
 * 
 * 定时检查并执行待成交的限价单
 * Schedule: 每30秒执行一次
 * 
 * 配置方法：在netlify.toml中添加：
 * [[plugins]]
 *   package = "@netlify/plugin-functions-core"
 * 
 * [functions]
 *   schedule = "scheduled-match-orders"
 *   cron = "*/30 * * * * *"
 */

import { schedule } from '@netlify/functions';
import { matchLimitOrders } from '../../src/lib/services/order-matching.service';
import { logger } from '../../src/lib/utils/logger';

/**
 * 定时任务处理函数
 */
const handler = schedule('*/30 * * * * *', async () => {
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

