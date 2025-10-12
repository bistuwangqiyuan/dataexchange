/**
 * 部署验证脚本 - 自动等待并验证Netlify部署
 */

const BASE_URL = 'https://dataexchangenelify.netlify.app';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// 测试单个API端点
async function testAPI(endpoint, name) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const isHTML = response.headers.get('content-type')?.includes('text/html');
    
    if (response.status === 404 && isHTML) {
      return { success: false, status: 404, isHTML: true, name };
    } else if (response.status === 200 || response.status === 401) {
      return { success: true, status: response.status, name };
    } else {
      return { success: false, status: response.status, name };
    }
  } catch (error) {
    return { success: false, error: error.message, name };
  }
}

// 等待并检查部署
async function waitForDeployment() {
  log('\n⏳ 等待Netlify部署完成...', 'cyan');
  log('预计需要 60-90 秒\n', 'cyan');
  
  const startTime = Date.now();
  let countdown = 90;
  
  // 显示倒计时
  const countdownInterval = setInterval(() => {
    countdown--;
    process.stdout.write(`\r${colors.yellow}⏱️  剩余时间: ${countdown}秒...${colors.reset}`);
    if (countdown <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
  
  // 等待90秒
  await delay(90);
  clearInterval(countdownInterval);
  
  const waitTime = ((Date.now() - startTime) / 1000).toFixed(0);
  log(`\n\n✅ 等待完成 (${waitTime}秒)\n`, 'green');
}

// 验证修复
async function verifyFix() {
  log('🔍 开始验证API修复...\n', 'cyan');
  
  const tests = [
    { endpoint: '/api/market/tickers', name: '市场行情API' },
    { endpoint: '/api/market/BTC-USDT', name: 'BTC价格API' },
    { endpoint: '/api/auth/register', name: '注册API' },
    { endpoint: '/api/auth/login', name: '登录API' },
    { endpoint: '/api/wallet/balances', name: '钱包余额API' },
    { endpoint: '/api/orders/active', name: '活跃订单API' }
  ];
  
  let fixed = 0;
  let stillBroken = 0;
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.name);
    
    if (result.success) {
      log(`✅ ${test.name} - 正常 (HTTP ${result.status})`, 'green');
      fixed++;
    } else if (result.isHTML && result.status === 404) {
      log(`❌ ${test.name} - 仍然404`, 'red');
      stillBroken++;
    } else {
      log(`⚠️  ${test.name} - 状态码 ${result.status}`, 'yellow');
    }
    
    await delay(0.5); // 避免请求过快
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 验证结果总结', 'blue');
  log('='.repeat(60), 'blue');
  log(`\n✅ 修复成功: ${fixed}/${tests.length}`, 'green');
  log(`❌ 仍有问题: ${stillBroken}/${tests.length}`, stillBroken > 0 ? 'red' : 'green');
  
  const successRate = ((fixed / tests.length) * 100).toFixed(1);
  log(`\n📈 API可用率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  return { fixed, stillBroken, total: tests.length, successRate: parseFloat(successRate) };
}

// 运行完整测试
async function runFullTest() {
  log('\n🚀 运行完整自动化测试...\n', 'cyan');
  
  try {
    // 动态导入测试脚本
    const { runAllTests } = await import('./automated-test.js');
    const results = await runAllTests();
    return results;
  } catch (error) {
    log(`❌ 无法运行完整测试: ${error.message}`, 'red');
    return null;
  }
}

// 生成最终报告
function generateFinalReport(verifyResults, testResults) {
  log('\n' + '='.repeat(60), 'magenta');
  log('🎯 最终验证报告', 'magenta');
  log('='.repeat(60), 'magenta');
  
  log('\n【API修复状态】', 'cyan');
  if (verifyResults.successRate >= 80) {
    log('✅ 修复成功！API已恢复正常', 'green');
  } else if (verifyResults.successRate >= 50) {
    log('⚠️  部分修复，仍需进一步调试', 'yellow');
  } else {
    log('❌ 修复失败，问题仍然存在', 'red');
  }
  
  if (testResults) {
    log('\n【完整测试结果】', 'cyan');
    log(`总测试用例: ${testResults.total}`, 'reset');
    log(`✅ 通过: ${testResults.passed} (${testResults.passRate}%)`, 'green');
    log(`❌ 失败: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  }
  
  log('\n【对比数据】', 'cyan');
  log('修复前: 58.8% 通过率 (API全部404)', 'reset');
  log(`修复后: ${testResults ? testResults.passRate + '%' : verifyResults.successRate + '%'} 通过率`, 'reset');
  
  const improvement = testResults ? testResults.passRate - 58.8 : verifyResults.successRate - 58.8;
  if (improvement > 0) {
    log(`📈 提升: +${improvement.toFixed(1)}%`, 'green');
  }
  
  log('\n【建议】', 'cyan');
  if (verifyResults.successRate >= 80) {
    log('✅ 平台已可对外开放', 'green');
    log('✅ 建议进行人工测试验证', 'green');
    log('✅ 可以开始配置Supabase数据库', 'green');
  } else {
    log('⚠️  需要查看Netlify部署日志', 'yellow');
    log('⚠️  检查环境变量配置', 'yellow');
    log('⚠️  参考 API_FIX_GUIDE.md 执行备用方案', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'magenta');
  log('验证完成！', 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
}

// 主流程
async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 DataExchange平台 - 自动部署验证', 'blue');
  log('='.repeat(60), 'blue');
  log(`\n部署URL: ${BASE_URL}`, 'cyan');
  log(`验证时间: ${new Date().toLocaleString('zh-CN')}\n`, 'cyan');
  
  try {
    // 第1步：等待部署
    await waitForDeployment();
    
    // 第2步：快速验证API
    const verifyResults = await verifyFix();
    
    // 第3步：运行完整测试（如果快速验证通过）
    let testResults = null;
    if (verifyResults.successRate >= 50) {
      log('\n✅ API基本正常，运行完整测试套件...\n', 'green');
      await delay(2);
      testResults = await runFullTest();
    } else {
      log('\n⚠️  API仍有问题，跳过完整测试\n', 'yellow');
    }
    
    // 第4步：生成最终报告
    await delay(1);
    generateFinalReport(verifyResults, testResults);
    
    // 第5步：保存结果
    const fs = await import('fs');
    const finalResults = {
      timestamp: new Date().toISOString(),
      verifyResults,
      testResults,
      status: verifyResults.successRate >= 80 ? 'success' : 'needs_attention'
    };
    
    fs.writeFileSync(
      new URL('verification-results.json', import.meta.url),
      JSON.stringify(finalResults, null, 2)
    );
    
    log('📝 详细结果已保存到: test-scripts/verification-results.json\n', 'cyan');
    
    // 返回退出码
    process.exit(verifyResults.successRate >= 50 ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ 验证过程出错: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// 执行
main();

