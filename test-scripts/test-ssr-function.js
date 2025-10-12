/**
 * 测试SSR函数是否存在
 */

const BASE_URL = 'https://dataexchangenelify.netlify.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSSRFunction() {
  log('\n🔍 测试SSR函数直接访问\n', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/.netlify/functions/ssr`);
    const text = await response.text();
    
    log(`状态码: ${response.status}`, response.status === 404 ? 'red' : 'green');
    log(`响应类型: ${response.headers.get('content-type')}`, 'cyan');
    log(`响应内容（前200字符）:\n${text.substring(0, 200)}...\n`, 'yellow');
    
    if (response.status === 404) {
      log('❌ SSR函数不存在或未正确部署', 'red');
      log('\n原因分析:', 'yellow');
      log('1. Netlify构建过程中SSR函数未生成', 'yellow');
      log('2. 函数文件未上传到Netlify', 'yellow');
      log('3. 函数名称不是"ssr"', 'yellow');
      
      log('\n解决方案:', 'cyan');
      log('1. 查看Netlify构建日志，搜索"Generated SSR Function"', 'cyan');
      log('2. 访问 https://app.netlify.com/sites/dataexchangenelify/functions', 'cyan');
      log('3. 检查是否有函数列表', 'cyan');
      log('4. 尝试手动部署：netlify deploy --prod\n', 'cyan');
    } else if (response.status === 200 || response.status === 500) {
      log('✅ SSR函数存在！', 'green');
      log('\n这意味着问题在于重定向配置！', 'yellow');
      log('\n解决方案:', 'cyan');
      log('1. 修改 netlify.toml 中的重定向规则', 'cyan');
      log('2. 尝试使用 :splat 参数', 'cyan');
      log('3. 调整重定向优先级\n', 'cyan');
    } else {
      log(`⚠️  意外状态码: ${response.status}`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
  }
}

testSSRFunction();

