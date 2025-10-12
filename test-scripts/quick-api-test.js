/**
 * 快速API测试 - 立即验证API状态
 */

const BASE_URL = 'https://dataexchangenelify.netlify.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(endpoint, name) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const responseTime = Date.now() - startTime;
    
    const contentType = response.headers.get('content-type') || '';
    const isJSON = contentType.includes('application/json');
    const isHTML = contentType.includes('text/html');
    
    let data;
    try {
      if (isJSON) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text.substring(0, 200);
      }
    } catch (e) {
      data = 'Unable to parse response';
    }
    
    return {
      name,
      endpoint,
      status: response.status,
      responseTime,
      isJSON,
      isHTML,
      contentType,
      data
    };
  } catch (error) {
    return {
      name,
      endpoint,
      error: error.message,
      failed: true
    };
  }
}

async function runQuickTest() {
  log('\n' + '='.repeat(70), 'blue');
  log('🚀 快速API测试 - DataExchange平台', 'blue');
  log('='.repeat(70), 'blue');
  log(`\n🌐 测试URL: ${BASE_URL}`, 'cyan');
  log(`⏰ 测试时间: ${new Date().toLocaleString('zh-CN')}\n`, 'cyan');
  
  const tests = [
    { endpoint: '/api/market/tickers', name: '市场行情API' },
    { endpoint: '/api/market/BTC-USDT', name: 'BTC-USDT价格' },
    { endpoint: '/api/auth/register', name: '注册API (POST)' },
    { endpoint: '/api/auth/login', name: '登录API (POST)' },
    { endpoint: '/api/wallet/balances', name: '钱包余额API' },
    { endpoint: '/api/orders/active', name: '活跃订单API' }
  ];
  
  log('🔍 开始测试...\n', 'cyan');
  
  let success = 0;
  let failed = 0;
  let needs404 = 0;
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.name);
    
    if (result.failed) {
      log(`❌ ${result.name}`, 'red');
      log(`   错误: ${result.error}\n`, 'red');
      failed++;
    } else {
      // 判断结果
      const is404HTML = result.status === 404 && result.isHTML;
      const isOK = result.status === 200 && result.isJSON;
      const needsAuth = (result.status === 401 || result.status === 403) && result.isJSON;
      
      if (is404HTML) {
        log(`❌ ${result.name} - 仍然返回404页面`, 'red');
        log(`   状态: ${result.status} | 类型: ${result.contentType}`, 'red');
        log(`   响应: ${result.data.substring(0, 100)}...\n`, 'red');
        needs404++;
      } else if (isOK) {
        log(`✅ ${result.name} - 正常响应`, 'green');
        log(`   状态: ${result.status} | 响应时间: ${result.responseTime}ms`, 'green');
        log(`   数据: ${JSON.stringify(result.data).substring(0, 100)}...\n`, 'green');
        success++;
      } else if (needsAuth) {
        log(`✅ ${result.name} - API可用（需要认证）`, 'green');
        log(`   状态: ${result.status} | 响应时间: ${result.responseTime}ms`, 'green');
        log(`   消息: ${JSON.stringify(result.data).substring(0, 100)}\n`, 'yellow');
        success++;
      } else {
        log(`⚠️  ${result.name} - 返回 ${result.status}`, 'yellow');
        log(`   类型: ${result.contentType}`, 'yellow');
        log(`   响应: ${JSON.stringify(result.data).substring(0, 100)}...\n`, 'yellow');
      }
    }
  }
  
  // 总结
  log('\n' + '='.repeat(70), 'blue');
  log('📊 测试结果总结', 'blue');
  log('='.repeat(70), 'blue');
  
  const total = tests.length;
  const successRate = ((success / total) * 100).toFixed(1);
  
  log(`\n✅ API正常: ${success}/${total}`, success > 0 ? 'green' : 'red');
  log(`❌ 404错误: ${needs404}/${total}`, needs404 > 0 ? 'red' : 'green');
  log(`⚠️  其他错误: ${failed}/${total}`, failed > 0 ? 'yellow' : 'green');
  log(`\n📈 API可用率: ${successRate}%`, parseFloat(successRate) >= 80 ? 'green' : 'red');
  
  // 结论和建议
  log('\n' + '='.repeat(70), 'cyan');
  log('💡 结论和建议', 'cyan');
  log('='.repeat(70), 'cyan');
  
  if (needs404 === total) {
    log('\n❌ 所有API仍返回404 - 部署尚未生效', 'red');
    log('\n建议操作：', 'yellow');
    log('1. 等待2-3分钟让Netlify完成部署', 'yellow');
    log('2. 访问 https://app.netlify.com/sites/dataexchangenelify/deploys', 'yellow');
    log('3. 检查最新部署状态（应该是绿色"Published"）', 'yellow');
    log('4. 如果部署失败，查看构建日志', 'yellow');
    log('5. 参考 API_FIX_GUIDE.md 的备用方案\n', 'yellow');
  } else if (success >= total * 0.8) {
    log('\n✅ API已修复！大部分端点正常工作', 'green');
    log('\n建议操作：', 'green');
    log('1. 运行完整测试套件：node test-scripts/automated-test.js', 'green');
    log('2. 配置Supabase环境变量', 'green');
    log('3. 测试用户注册和登录功能', 'green');
    log('4. 开始使用平台\n', 'green');
  } else if (success > 0) {
    log('\n⚠️  API部分修复 - 某些端点仍有问题', 'yellow');
    log('\n建议操作：', 'yellow');
    log('1. 检查Netlify环境变量配置', 'yellow');
    log('2. 查看Netlify Functions日志', 'yellow');
    log('3. 确认Supabase配置正确\n', 'yellow');
  } else {
    log('\n❌ 修复失败 - 需要深入调试', 'red');
    log('\n建议操作：', 'red');
    log('1. 立即查看Netlify部署日志', 'red');
    log('2. 检查是否有构建错误', 'red');
    log('3. 验证环境变量配置', 'red');
    log('4. 尝试手动部署：netlify deploy --prod\n', 'red');
  }
  
  log('='.repeat(70) + '\n', 'cyan');
  
  return { success, failed, needs404, total, successRate: parseFloat(successRate) };
}

// 执行测试
runQuickTest()
  .then(results => {
    process.exit(results.needs404 > 0 ? 1 : 0);
  })
  .catch(error => {
    log(`\n❌ 测试失败: ${error.message}`, 'red');
    process.exit(1);
  });

