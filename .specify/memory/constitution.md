<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0
- Modified principles:
  * Principle 1: Test coverage requirement increased from 80% to 90%
  * Principle 2: Enhanced with documentation completeness requirements
- Added sections:
  * Principle 6: Code Quality Assurance (elevated from Technical Standards)
  * Principle 7: RESTful API Design Principles
  * Principle 8: Complete Monitoring and Logging
  * Principle 9: SEO Optimization Principles
- Removed sections: N/A
- Templates requiring updates:
  ✅ constitution.md updated
  ⚠ plan-template.md: Should verify "Constitution Check" includes new principles 6-9
  ⚠ spec-template.md: Should include API design guidelines reference
  ⚠ tasks-template.md: Consider adding monitoring, logging, and SEO task types
- Follow-up TODOs:
  - Review implementation plans to ensure 90% test coverage target
  - Verify API endpoints follow RESTful design principles
  - Ensure monitoring and logging infrastructure is planned
  - Add SEO optimization tasks for public-facing pages
-->

# DataExchange Project Constitution

**Version**: 1.2.0  
**Ratified**: 2025-10-11  
**Last Amended**: 2025-10-12

## Purpose

This constitution defines the core principles, technical standards, and governance model for the DataExchange project. All contributors, code, and architectural decisions must align with these foundational rules.

---

## Core Principles

### Principle 1: Test-Driven Development (TDD) 是强制的

**Rule**: 所有功能代码必须先编写测试，然后实现功能。测试覆盖率必须达到90%以上。

**Rationale**: TDD确保代码质量、可维护性和可测试性。先写测试能够：
- 明确功能需求和边界条件
- 防止回归错误
- 提高代码设计质量
- 确保文档与实现同步
- 提供可靠的安全网，支持重构和快速迭代

**Implementation**:
- 每个新功能必须包含至少1个预期用例测试
- 每个新功能必须包含至少1个边界情况测试
- 每个新功能必须包含至少1个失败场景测试
- 测试应组织在 `/tests` 目录中，镜像主应用结构
- CI/CD管道必须强制测试通过率100%才能合并
- **测试覆盖率必须达到99%以上**，通过CI/CD自动检查
- 关键业务逻辑的测试覆盖率必须达到100%
- 使用覆盖率报告工具（如Istanbul、c8）生成详细报告

### Principle 2: 代码必须有详细的文档注释

**Rule**: 所有公共API、复杂逻辑和关键业务流程必须有完整的文档注释。文档必须与代码同步更新。

**Rationale**: 详细的文档注释确保代码可读性和团队协作效率，降低维护成本。完整的文档能够：
- 加速新成员的上手速度
- 减少代码误用和bug
- 提供自文档化的API
- 支持自动生成文档站点

**Implementation**:
- 使用JSDoc、TypeDoc或语言对应的文档标准
- 每个函数/方法必须包含：用途说明、参数描述、返回值说明、异常情况
- 复杂算法必须添加内联注释说明 `// Reason: ...` 解释为什么这样做
- 非显而易见的代码必须添加注释，确保中级开发者能理解
- 关键业务逻辑必须包含中间步骤的日志输出
- **每个模块必须包含README.md说明模块用途、使用方法和示例**
- **API端点必须有OpenAPI/Swagger规范文档**
- **数据模型必须有完整的字段说明和关系图**
- 文档更新与代码更新同步进行，不得滞后

### Principle 3: 使用Jamstack技术栈

**Rule**: 项目必须遵循Jamstack架构原则：预渲染、解耦、静态优先。

**Rationale**: Jamstack提供更好的性能、安全性、扩展性和开发体验。

**Implementation**:
- 使用静态站点生成器（如Astro、Next.js等）
- API层通过无服务器函数（Supabase Functions、Netlify Functions）实现
- 使用Supabase作为数据服务，所有数据通过API访问
- 不使用传统后端服务器或本地数据库
- 部署到Netlify或类似的Jamstack托管平台
- 采用移动优先的响应式设计

### Principle 4: 用户的所有输入都应该被记录在md中

**Rule**: 所有用户交互、需求变更、决策过程必须记录在Markdown文档中。

**Rationale**: 完整的文档记录确保项目透明度、可追溯性和知识传承。

**Implementation**:
- 新任务在 `README.md` 的 TASK 部分记录，包含简要描述和日期
- 重要决策和架构变更记录在 `docs/decisions/` 目录下的ADR（Architecture Decision Record）
- 用户需求和反馈记录在 `docs/requirements/` 目录
- 开发过程中发现的子任务添加到 README.md 的 "Discovered During Work" 部分
- 完成的任务立即在 README.md 中标记为完成
- 重大更新必须同步更新 README.md

### Principle 5: 为用户提供完整详细易于理解且带有链接可直接点击操作的提示

**Rule**: 所有用户面向的指引、文档和提示必须包含完整、详细且易于理解的说明，
并提供可直接点击的链接以便用户立即执行操作。

**Rationale**: 降低用户的认知负担和操作难度，提升用户体验和工作效率。
清晰的指引和便捷的链接可以：
- 减少用户的困惑和挫折感
- 加快任务完成速度
- 降低技术门槛，让非技术用户也能顺利操作
- 减少支持请求和文档查阅时间
- 提高文档的可操作性和实用价值

**Implementation**:
- 所有错误消息必须包含：问题描述、原因说明、解决方案链接
- 部署指南必须包含可点击的Dashboard链接和CLI命令示例
- 配置说明必须包含具体的步骤编号和截图（如需）
- API文档必须包含交互式示例和测试端点链接
- 设置指南必须提供一键复制的命令和配置文件模板
- README.md中的所有操作步骤必须包含相关文档链接
- 终端输出和日志消息应包含下一步操作的建议和链接
- 用户提示使用清晰的格式：问题 → 原因 → 解决方案（带链接）

**Examples**:
```markdown
✅ Good:
> ❌ 部署失败：环境变量未配置
> 
> **原因**: SUPABASE_URL 和 SUPABASE_ANON_KEY 未设置
> 
> **解决方案**:
> 1. 访问 [Netlify环境变量设置](https://app.netlify.com/sites/YOUR_SITE/settings/env)
> 2. 添加以下变量：
>    ```
>    SUPABASE_URL=your_url
>    SUPABASE_ANON_KEY=your_key
>    ```
> 3. 重新部署：`netlify deploy --prod`
> 
> 📖 详细文档：[环境配置指南](docs/ENV_SETUP.md)

❌ Bad:
> 部署失败，请配置环境变量
```

### Principle 6: 代码质量保证

**Rule**: 所有代码必须通过严格的质量检查，包括静态分析、代码审查和自动化测试。

**Rationale**: 高质量的代码确保：
- 减少生产环境的bug和故障
- 提高代码可维护性和可读性
- 降低技术债务积累
- 提升团队开发效率
- 保证系统的稳定性和可靠性

**Implementation**:
- **Linting**: 所有代码必须通过ESLint检查，无警告无错误
- **Type Safety**: 强制使用TypeScript，启用strict模式
- **Code Review**: 所有PR必须经过至少1人的代码审查
- **Automated Testing**: 所有功能必须有自动化测试
- **Static Analysis**: 使用SonarQube或类似工具进行代码质量分析
- **Code Complexity**: 函数复杂度（Cyclomatic Complexity）不得超过10
- **Code Duplication**: 重复代码率不得超过3%
- **Security Scanning**: 使用依赖扫描工具检查安全漏洞
- **Performance Profiling**: 关键路径代码必须进行性能分析
- **Code Coverage**: 维持90%以上的测试覆盖率
- **Git Hooks**: 使用pre-commit钩子自动运行lint和格式化

### Principle 7: RESTful API设计原则

**Rule**: 所有API端点必须遵循RESTful设计原则和HTTP标准。

**Rationale**: RESTful API提供：
- 统一的接口设计，降低学习成本
- 清晰的资源层次结构
- 标准化的HTTP方法语义
- 更好的可缓存性和扩展性
- 便于文档生成和测试

**Implementation**:
- **资源命名**: 使用名词复数形式（如 `/api/users`, `/api/orders`）
- **HTTP方法**: 
  - GET: 查询资源
  - POST: 创建资源
  - PUT/PATCH: 更新资源
  - DELETE: 删除资源
- **状态码**: 正确使用HTTP状态码
  - 200: 成功
  - 201: 创建成功
  - 400: 客户端错误
  - 401: 未认证
  - 403: 无权限
  - 404: 资源不存在
  - 500: 服务器错误
- **响应格式**: 统一的JSON响应结构
  ```json
  {
    "success": true,
    "data": {},
    "error": null,
    "timestamp": "2025-10-12T10:00:00Z"
  }
  ```
- **版本控制**: 使用URL路径版本（如 `/api/v1/users`）
- **分页**: 统一的分页参数（page, page_size, total）
- **筛选排序**: 使用查询参数（filter, sort, order）
- **错误处理**: 提供详细的错误消息和错误码
- **文档**: 使用OpenAPI 3.0规范生成API文档
- **安全**: 所有端点必须有认证和授权检查

### Principle 8: 完整的监控和日志系统

**Rule**: 系统必须实现完整的监控、日志记录和告警机制。

**Rationale**: 完整的可观测性确保：
- 快速定位和解决生产问题
- 了解系统运行状态和性能
- 追踪用户行为和系统使用情况
- 满足合规和审计要求
- 支持数据驱动的决策

**Implementation**:
- **结构化日志**: 使用结构化日志格式（JSON）
  ```typescript
  logger.info('User login', {
    userId: '123',
    email: 'user@example.com',
    ip: '192.168.1.1',
    timestamp: new Date().toISOString()
  });
  ```
- **日志级别**: 正确使用日志级别
  - DEBUG: 调试信息（仅开发环境）
  - INFO: 一般信息
  - WARN: 警告信息
  - ERROR: 错误信息
  - FATAL: 严重错误
- **关键事件日志**: 记录所有关键业务操作
  - 用户登录/登出
  - 订单创建/取消
  - 资金变动
  - 安全事件
- **性能监控**: 
  - API响应时间
  - 数据库查询时间
  - 页面加载时间
  - 资源使用情况（CPU、内存）
- **错误追踪**: 使用Sentry或类似工具追踪错误
- **告警机制**: 
  - 错误率超过阈值时告警
  - 响应时间超过阈值时告警
  - 系统资源不足时告警
- **日志存储**: 日志保留至少90天
- **审计日志**: 记录所有敏感操作到security_logs表
- **监控仪表板**: 提供实时监控仪表板
- **日志查询**: 支持日志搜索和过滤功能

### Principle 9: SEO优化原则

**Rule**: 所有面向公众的页面必须实施SEO最佳实践。

**Rationale**: SEO优化确保：
- 提高搜索引擎排名和可见性
- 增加自然流量
- 改善用户体验
- 提升网站权威性
- 降低获客成本

**Implementation**:
- **语义化HTML**: 使用正确的HTML5语义标签
  - `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`
- **Meta标签**: 
  ```html
  <title>页面标题 - 网站名称</title>
  <meta name="description" content="页面描述（150-160字符）">
  <meta name="keywords" content="关键词1, 关键词2">
  <meta name="robots" content="index, follow">
  ```
- **Open Graph**: 社交媒体分享优化
  ```html
  <meta property="og:title" content="页面标题">
  <meta property="og:description" content="页面描述">
  <meta property="og:image" content="分享图片URL">
  <meta property="og:type" content="website">
  ```
- **结构化数据**: 使用JSON-LD格式的Schema.org标记
- **URL优化**: 
  - 使用简短、描述性的URL
  - 使用连字符分隔单词
  - 避免特殊字符和查询参数
- **图片优化**: 
  - 使用alt属性
  - 压缩图片大小
  - 使用WebP格式
  - 实施lazy loading
- **性能优化**: 
  - 首次内容绘制（FCP）< 1.8秒
  - 最大内容绘制（LCP）< 2.5秒
  - 累积布局偏移（CLS）< 0.1
- **移动友好**: 响应式设计，通过Google移动友好测试
- **Sitemap**: 生成并提交XML sitemap
- **Robots.txt**: 正确配置robots.txt文件
- **Canonical标签**: 避免重复内容
- **内链策略**: 合理的内部链接结构
- **页面加载速度**: 使用CDN、压缩、缓存策略优化

---

## Technical Standards

### Code Quality

- **Linting**: 所有代码必须通过linter检查（ESLint、Prettier等）
- **Type Safety**: 优先使用TypeScript或类型注解
- **Naming**: 使用camelCase命名变量和函数，PascalCase命名类和组件
- **Modularity**: 代码按功能或职责组织成清晰分离的模块
- **Imports**: 优先使用相对导入（包内）
- **File Size**: 单个代码文件不得超过99999行，超过需重构拆分

### Security & Performance

- **Priority Order**: 安全 > 可读 > 性能
- **Data Validation**: 所有用户输入必须验证和清理
- **Error Handling**: 使用结构化错误处理，不得使用全局try-catch掩盖问题
- **Real Data Only**: 禁止使用模拟数据回退机制，必须使用真实数据和真实API调用
- **No Fallbacks**: 不得使用降级机制掩盖问题，而应通过精致的提示通知用户

### Architecture Patterns

- **Single Source of Truth**: 以仓库内"现有代码 + 规范化示例（code-examples/）+ 更新式文档"为唯一依据
- **No Hallucination**: 禁止捏造库、函数、文件或结果
- **Path Verification**: 引用代码前必须确认文件路径和模块名存在
- **Component Reusability**: 所有页面使用统一的header和footer组件
- **Permission Management**: 所有数据权限管理由Supabase远程服务处理

---

## Development Workflow

### Phase Separation

开发过程必须清晰分为以下独立阶段，不得混淆：

1. **规划阶段**: 需求分析、技术选型、架构设计
2. **文档阶段**: PRD编写、API设计文档、数据模型设计
3. **设计阶段**: UI/UX设计、组件设计
4. **开发阶段**: 代码实现（不运行终端命令）
5. **测试阶段**: 编写测试用例、运行测试、修复bug
6. **部署阶段**: 构建、部署到生产环境

**重要规则**:
- 测试和部署阶段外，其他阶段不得运行终端命令
- 开发阶段不得部署，除非用户有特殊需求
- 所有阶段完成后才进行下一阶段

### Testing Protocol

- 测试前必须编制详细的最高质量测试用例
- UI界面类测试可通过MCP调用工具实现
- 优先使用Node.js脚本运行测试，避免使用npm命令（npm常卡死）
- 测试必须使用真实数据，不得使用模拟数据
- 本地+CI通过率必须=100%才能合并
- **测试覆盖率必须达到90%以上**

### Deployment Protocol

- 使用pnpm而非npm进行部署
- 部署尽量分成构建和无构建部署两步执行
- Netlify部署拆分为：`pnpm run build` 和 `netlify deploy --prod --no-build`
- 长时间运行的终端命令应拆分为30秒以下的分步命令
- 所有任务开发完成后统一部署

### Documentation Maintenance

- 开发前必须编制最高质量的README和PRD等必要文档
- 新功能添加、依赖变更、设置步骤修改时必须更新README.md
- 更新README时不得删除现有内容，应标记完成或追加更新
- 发现的子任务添加到README的"Discovered During Work"部分
- 完成任务后立即在README的TASK部分标记为完成

---

## Governance

### Amendment Procedure

1. 提出修正案并说明理由
2. 评估对现有原则和模板的影响
3. 更新constitution.md并递增版本号
4. 同步更新所有依赖的模板文件
5. 提交带有清晰说明的commit

### Versioning Policy

遵循语义化版本（Semantic Versioning）：

- **MAJOR**: 向后不兼容的治理/原则移除或重新定义
- **MINOR**: 新增原则/部分或实质性扩展指导
- **PATCH**: 澄清措辞、修正拼写、非语义细化

### Compliance Review

- 每次PR必须检查是否符合constitution原则
- CI/CD管道强制执行测试覆盖率（≥90%）和linting规则
- 定期（季度）审查constitution的有效性和相关性
- 违反constitution的代码不得合并到主分支
- 使用自动化工具检查代码质量和测试覆盖率
- 监控系统必须记录所有关键操作和性能指标
- SEO检查应纳入部署前验证流程

---

## Enforcement

违反本宪章的代码或流程将：
1. 在PR审查中被拒绝
2. 在CI/CD中失败
3. 需要重新设计以符合原则

本宪章是项目的最高技术法律，所有决策必须以此为准。
