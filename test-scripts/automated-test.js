/**
 * 自动化测试脚本 - DataExchange平台
 * 
 * 该脚本用于测试已部署的生产环境
 * URL: https://dataexchangenelify.netlify.app
 */

const BASE_URL = 'https://dataexchangenelify.netlify.app';

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// 日志工具
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
  results.passed++;
  results.total++;
}

function logError(message, error = null) {
  log(`❌ ${message}`, 'red');
  results.failed++;
  results.total++;
  if (error) {
    results.errors.push({ message, error: error.toString() });
    log(`   错误详情: ${error}`, 'red');
  }
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
  results.warnings++;
}

function logInfo(message) {
  log(message, 'cyan');
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'blue');
  log('='.repeat(60), 'blue');
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试工具函数
async function testPageLoad(url, testName) {
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    if (response.ok) {
      logSuccess(`${testName} - 页面加载成功 (${loadTime}ms)`);
      if (loadTime > 2000) {
        logWarning(`${testName} - 加载时间超过2秒`);
      }
      return { success: true, loadTime, response };
    } else {
      logError(`${testName} - 页面加载失败 (状态码: ${response.status})`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    logError(`${testName} - 网络错误`, error);
    return { success: false, error };
  }
}

async function testAPIEndpoint(endpoint, options = {}, testName) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      logSuccess(`${testName} - 响应成功 (${responseTime}ms)`);
      if (responseTime > 1000) {
        logWarning(`${testName} - 响应时间超过1秒`);
      }
      return { success: true, data, responseTime, status: response.status };
    } else {
      logError(`${testName} - API返回错误 (状态码: ${response.status})`);
      log(`   响应内容: ${JSON.stringify(data).substring(0, 200)}`, 'red');
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`${testName} - API请求失败`, error);
    return { success: false, error };
  }
}

// ==================== 测试模块 ====================

// 1. 静态资源测试
async function testStaticResources() {
  logSection('1. 静态资源测试');

  // TC-STATIC-001: favicon
  await testPageLoad(`${BASE_URL}/favicon.svg`, 'TC-STATIC-001: Favicon加载');
  
  // TC-SEO-003: robots.txt
  await testPageLoad(`${BASE_URL}/robots.txt`, 'TC-SEO-003: robots.txt');
  
  // TC-SEO-004: sitemap.xml
  await testPageLoad(`${BASE_URL}/sitemap.xml`, 'TC-SEO-004: sitemap.xml');
  
  // TC-STATIC-002: manifest.json
  await testPageLoad(`${BASE_URL}/manifest.json`, 'TC-STATIC-002: manifest.json');
}

// 2. 页面加载测试
async function testPageLoads() {
  logSection('2. 页面加载测试');

  // TC-DASHBOARD-001: 首页
  await testPageLoad(`${BASE_URL}/`, 'TC-DASHBOARD-001: 首页');
  
  // TC-AUTH-001相关: 注册页面
  await testPageLoad(`${BASE_URL}/register`, 'TC-AUTH-001相关: 注册页面');
  
  // TC-AUTH-006相关: 登录页面
  await testPageLoad(`${BASE_URL}/login`, 'TC-AUTH-006相关: 登录页面');
  
  // TC-MARKET-001: 市场行情页面
  await testPageLoad(`${BASE_URL}/markets`, 'TC-MARKET-001: 市场行情页面');
  
  // TC-TRADE-001相关: 交易页面
  await testPageLoad(`${BASE_URL}/trade`, 'TC-TRADE-001相关: 交易页面');
  
  // TC-WALLET-001相关: 钱包页面
  await testPageLoad(`${BASE_URL}/wallet`, 'TC-WALLET-001相关: 钱包页面');
  
  // TC-ORDER-001相关: 订单页面
  await testPageLoad(`${BASE_URL}/orders`, 'TC-ORDER-001相关: 订单页面');
}

// 3. 市场API测试
async function testMarketAPI() {
  logSection('3. 市场行情API测试');

  // TC-API-006: GET /api/market/tickers
  const tickersResult = await testAPIEndpoint(
    '/api/market/tickers',
    { method: 'GET' },
    'TC-API-006: 获取所有交易对价格'
  );
  
  if (tickersResult.success && tickersResult.data) {
    if (Array.isArray(tickersResult.data) || (tickersResult.data.data && Array.isArray(tickersResult.data.data))) {
      logInfo(`   返回了交易对数据`);
    }
  }

  // TC-API-007: GET /api/market/BTC-USDT
  await testAPIEndpoint(
    '/api/market/BTC-USDT',
    { method: 'GET' },
    'TC-API-007: 获取BTC-USDT价格'
  );

  // TC-API-008: GET /api/market/kline/BTC-USDT
  await testAPIEndpoint(
    '/api/market/kline/BTC-USDT?interval=1h&limit=100',
    { method: 'GET' },
    'TC-API-008: 获取BTC-USDT K线数据'
  );

  // TC-API-009: GET /api/market/orderbook/BTC-USDT
  await testAPIEndpoint(
    '/api/market/orderbook/BTC-USDT',
    { method: 'GET' },
    'TC-API-009: 获取BTC-USDT订单簿'
  );
}

// 4. 认证API测试（不实际注册，只测试端点可访问性）
async function testAuthAPI() {
  logSection('4. 认证API测试（端点可访问性）');

  // TC-API-001: POST /api/auth/register - 测试端点响应
  const registerResult = await testAPIEndpoint(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        email: '', // 空数据测试验证
        password: ''
      })
    },
    'TC-API-001: 注册API端点（验证测试）'
  );

  // TC-API-002: POST /api/auth/login - 测试端点响应
  await testAPIEndpoint(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email: '',
        password: ''
      })
    },
    'TC-API-002: 登录API端点（验证测试）'
  );
}

// 5. 未授权访问测试（测试需要认证的API）
async function testAuthRequiredEndpoints() {
  logSection('5. 认证保护测试');

  // TC-API-012: GET /api/orders/active - 未授权访问
  const activeOrdersResult = await testAPIEndpoint(
    '/api/orders/active',
    { method: 'GET' },
    'TC-API-012: 未授权访问活跃订单'
  );
  
  if (activeOrdersResult.status === 401 || activeOrdersResult.status === 403) {
    logInfo('   ✓ 正确拒绝未授权访问');
  } else if (activeOrdersResult.success) {
    logWarning('   ⚠ API未要求认证或使用了默认权限');
  }

  // TC-API-016: GET /api/wallet/balances - 未授权访问
  const balancesResult = await testAPIEndpoint(
    '/api/wallet/balances',
    { method: 'GET' },
    'TC-API-016: 未授权访问钱包余额'
  );
  
  if (balancesResult.status === 401 || balancesResult.status === 403) {
    logInfo('   ✓ 正确拒绝未授权访问');
  } else if (balancesResult.success) {
    logWarning('   ⚠ API未要求认证或使用了默认权限');
  }
}

// 6. 性能测试
async function testPerformance() {
  logSection('6. 性能测试');

  logInfo('测试首页加载性能...');
  const measurements = [];
  
  for (let i = 0; i < 3; i++) {
    const result = await testPageLoad(`${BASE_URL}/`, `性能测试 - 首页加载 (第${i+1}次)`);
    if (result.success) {
      measurements.push(result.loadTime);
    }
    await delay(500);
  }

  if (measurements.length > 0) {
    const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    logInfo(`   平均加载时间: ${avgTime.toFixed(0)}ms`);
    
    if (avgTime < 1000) {
      logSuccess('TC-PERF-001: 首页加载性能优秀 (< 1秒)');
    } else if (avgTime < 2000) {
      logSuccess('TC-PERF-001: 首页加载性能良好 (< 2秒)');
    } else {
      logWarning('TC-PERF-001: 首页加载性能需要优化 (> 2秒)');
    }
  }

  logInfo('\n测试API响应性能...');
  const apiMeasurements = [];
  
  for (let i = 0; i < 3; i++) {
    const result = await testAPIEndpoint(
      '/api/market/tickers',
      { method: 'GET' },
      `性能测试 - 市场API (第${i+1}次)`
    );
    if (result.success) {
      apiMeasurements.push(result.responseTime);
    }
    await delay(500);
  }

  if (apiMeasurements.length > 0) {
    const avgApiTime = apiMeasurements.reduce((a, b) => a + b, 0) / apiMeasurements.length;
    logInfo(`   平均API响应时间: ${avgApiTime.toFixed(0)}ms`);
    
    if (avgApiTime < 500) {
      logSuccess('TC-PERF-004: API响应性能优秀 (< 500ms)');
    } else if (avgApiTime < 1000) {
      logSuccess('TC-PERF-004: API响应性能良好 (< 1秒)');
    } else {
      logWarning('TC-PERF-004: API响应性能需要优化 (> 1秒)');
    }
  }
}

// 7. SEO元标签测试
async function testSEO() {
  logSection('7. SEO优化测试');

  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();

    // 检查各种meta标签
    const checks = [
      { tag: '<title>', name: 'Title标签' },
      { tag: 'name="description"', name: 'Description标签' },
      { tag: 'property="og:title"', name: 'Open Graph Title' },
      { tag: 'property="og:description"', name: 'Open Graph Description' },
      { tag: 'name="viewport"', name: 'Viewport标签' }
    ];

    checks.forEach(check => {
      if (html.includes(check.tag)) {
        logSuccess(`TC-SEO-001相关: ${check.name}存在`);
      } else {
        logWarning(`${check.name}未找到或格式不同`);
      }
    });

  } catch (error) {
    logError('SEO测试失败', error);
  }
}

// 8. 错误处理测试
async function testErrorHandling() {
  logSection('8. 错误处理测试');

  // 测试404页面
  await testPageLoad(`${BASE_URL}/non-existent-page`, 'TC-ERROR-001: 404页面处理');

  // 测试无效的API端点
  await testAPIEndpoint(
    '/api/market/INVALID-PAIR',
    { method: 'GET' },
    'TC-ERROR-002: 无效交易对处理'
  );

  // 测试无效的订单ID
  await testAPIEndpoint(
    '/api/orders/invalid-id-12345',
    { method: 'GET' },
    'TC-ERROR-003: 无效订单ID处理'
  );
}

// ==================== 主测试流程 ====================

async function runAllTests() {
  log('\n🚀 开始执行自动化测试', 'cyan');
  log(`测试目标: ${BASE_URL}`, 'cyan');
  log(`测试时间: ${new Date().toLocaleString('zh-CN')}`, 'cyan');
  log('\n');

  const startTime = Date.now();

  try {
    // 执行所有测试模块
    await testStaticResources();
    await delay(500);
    
    await testPageLoads();
    await delay(500);
    
    await testMarketAPI();
    await delay(500);
    
    await testAuthAPI();
    await delay(500);
    
    await testAuthRequiredEndpoints();
    await delay(500);
    
    await testPerformance();
    await delay(500);
    
    await testSEO();
    await delay(500);
    
    await testErrorHandling();

  } catch (error) {
    logError('测试执行过程中发生错误', error);
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);

  // 打印测试总结
  logSection('测试总结');
  log(`\n总测试用例: ${results.total}`, 'cyan');
  log(`✅ 通过: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`, 'green');
  log(`❌ 失败: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`, 'red');
  log(`⚠️  警告: ${results.warnings}`, 'yellow');
  log(`⏱️  总耗时: ${totalTime}秒`, 'cyan');

  if (results.errors.length > 0) {
    log('\n错误详情:', 'red');
    results.errors.forEach((err, index) => {
      log(`\n${index + 1}. ${err.message}`, 'red');
      log(`   ${err.error}`, 'red');
    });
  }

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  log('\n' + '='.repeat(60), 'blue');
  if (passRate >= 90) {
    log(`🎉 测试通过率: ${passRate}% - 优秀！`, 'green');
  } else if (passRate >= 70) {
    log(`👍 测试通过率: ${passRate}% - 良好`, 'cyan');
  } else {
    log(`⚠️  测试通过率: ${passRate}% - 需要改进`, 'yellow');
  }
  log('='.repeat(60), 'blue');

  // 返回测试结果用于生成报告
  return {
    ...results,
    totalTime,
    passRate: parseFloat(passRate),
    timestamp: new Date().toISOString()
  };
}

// 执行测试
runAllTests().then(async (results) => {
  // 保存结果到文件
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`\n📝 测试结果已保存到: ${reportPath}`, 'cyan');
  } catch (error) {
    log(`\n⚠️  无法保存测试结果: ${error.message}`, 'yellow');
  }
  
  // 根据测试结果退出
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  log(`\n❌ 测试执行失败: ${error}`, 'red');
  process.exit(1);
});

export { runAllTests, results };

