# 🧪 生产环境测试计划

## 修复内容
✅ 移除了netlify.toml中错误的API重定向配置
✅ API路由现在通过Astro SSR函数正确处理

## 测试清单

### 1. 基础页面访问测试
- [ ] 首页 (/)
- [ ] 登录页 (/login)
- [ ] 注册页 (/register)
- [ ] 市场页 (/markets)
- [ ] 交易页 (/trade)
- [ ] 订单页 (/orders)
- [ ] 钱包页 (/wallet)

### 2. 用户认证测试
- [ ] 注册新用户
  - 输入邮箱和密码
  - 点击注册按钮
  - 验证是否成功（无"网络错误"）
  - 检查是否收到注册成功消息
  
- [ ] 用户登录
  - 使用注册的账号登录
  - 验证是否成功登录
  - 检查是否保存session

### 3. 市场行情测试
- [ ] 访问市场页面 (/markets)
- [ ] 验证市场数据加载成功
- [ ] 应该看到至少3个交易对（BTC/USDT, ETH/USDT, BNB/USDT）
- [ ] 检查价格、涨跌幅、成交量显示正常

### 4. API端点测试
- [ ] GET /api/market/tickers - 获取所有行情
- [ ] POST /api/auth/register - 用户注册
- [ ] POST /api/auth/login - 用户登录
- [ ] POST /api/auth/logout - 用户登出

### 5. 浏览器控制台检查
- [ ] 无404错误
- [ ] 无JavaScript错误
- [ ] 无"<!DOCTYPE"的JSON解析错误
- [ ] API响应格式正确

## 测试步骤

### 步骤1: 等待部署完成（2-3分钟）
访问：https://app.netlify.com/sites/dataexchangenelify/deploys
等待最新部署状态变为"Published"

### 步骤2: 清除浏览器缓存
按 Ctrl+Shift+Delete 清除缓存，或使用无痕窗口

### 步骤3: 测试注册功能
```
URL: https://dataexchangenelify.netlify.app/register
测试数据：
- 邮箱: test-$(timestamp)@example.com
- 密码: Test123456!

预期结果：
✓ 无"网络错误"提示
✓ 显示注册成功消息或跳转
✓ 控制台无404错误
```

### 步骤4: 测试登录功能
```
URL: https://dataexchangenelify.netlify.app/login
使用刚注册的账号登录

预期结果：
✓ 无"网络错误"提示
✓ 成功登录并跳转
✓ 控制台无错误
```

### 步骤5: 测试市场行情
```
URL: https://dataexchangenelify.netlify.app/markets

预期结果：
✓ 无"加载失败"提示
✓ 显示市场数据（至少3个交易对）
✓ 价格、涨跌幅正常显示
✓ 控制台无404错误
✓ 无JSON解析错误
```

### 步骤6: 测试API直接访问
```bash
# 测试市场行情API
curl https://dataexchangenelify.netlify.app/api/market/tickers

预期返回：
{
  "success": true,
  "data": [
    {
      "trading_pair": "BTC/USDT",
      "price": "...",
      ...
    }
  ]
}
```

## 常见问题排查

### 问题1: 仍然显示404
**原因**: 浏览器缓存或CDN缓存
**解决**: 
- 清除浏览器缓存
- 等待CDN缓存过期（最多10分钟）
- 使用无痕窗口测试

### 问题2: 环境变量未生效
**原因**: Netlify环境变量未配置
**解决**: 
- 检查 https://app.netlify.com/sites/dataexchangenelify/settings/env
- 确认3个Supabase变量已配置
- 重新部署

### 问题3: Supabase连接失败
**原因**: Service Role Key配置错误
**解决**:
- 验证Service Role Key是否正确
- 检查Supabase项目是否正常运行

## 部署监控链接

- **部署状态**: https://app.netlify.com/sites/dataexchangenelify/deploys
- **网站URL**: https://dataexchangenelify.netlify.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zzyueuweeoakopuuwfau

## 测试时间安排

1. **立即**: Git推送完成 ✅
2. **2-3分钟后**: Netlify自动部署完成
3. **部署完成后**: 开始全面测试
4. **测试通过**: 标记所有TODO为完成

---

**⏰ 当前状态**: 等待Netlify自动部署完成（预计2-3分钟）

检查部署状态：https://app.netlify.com/sites/dataexchangenelify/deploys

