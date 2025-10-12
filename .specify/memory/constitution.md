<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles: N/A
- Added sections: Principle 5 (User Guidance & Accessibility)
- Removed sections: N/A
- Templates requiring updates:
  ✅ constitution.md updated
  ⚠ plan-template.md: Should verify "Constitution Check" section includes Principle 5
  ⚠ spec-template.md: No changes required (principle is implementation-focused)
  ⚠ tasks-template.md: Consider adding user guidance task types
- Follow-up TODOs:
  - Review implementation plans to ensure user guidance is included in task breakdown
  - Update any existing deployment/setup guides to include clickable links
-->

# DataExchange Project Constitution

**Version**: 1.1.0  
**Ratified**: 2025-10-11  
**Last Amended**: 2025-10-12

## Purpose

This constitution defines the core principles, technical standards, and governance model for the DataExchange project. All contributors, code, and architectural decisions must align with these foundational rules.

---

## Core Principles

### Principle 1: Test-Driven Development (TDD) 是强制的

**Rule**: 所有功能代码必须先编写测试，然后实现功能。测试覆盖率必须达到80%以上。

**Rationale**: TDD确保代码质量、可维护性和可测试性。先写测试能够：
- 明确功能需求和边界条件
- 防止回归错误
- 提高代码设计质量
- 确保文档与实现同步

**Implementation**:
- 每个新功能必须包含至少1个预期用例测试
- 每个新功能必须包含至少1个边界情况测试
- 每个新功能必须包含至少1个失败场景测试
- 测试应组织在 `/tests` 目录中，镜像主应用结构
- CI/CD管道必须强制测试通过率100%才能合并

### Principle 2: 代码必须有详细的文档注释

**Rule**: 所有公共API、复杂逻辑和关键业务流程必须有完整的文档注释。

**Rationale**: 详细的文档注释确保代码可读性和团队协作效率，降低维护成本。

**Implementation**:
- 使用JSDoc、TypeDoc或语言对应的文档标准
- 每个函数/方法必须包含：用途说明、参数描述、返回值说明、异常情况
- 复杂算法必须添加内联注释说明 `// Reason: ...` 解释为什么这样做
- 非显而易见的代码必须添加注释，确保中级开发者能理解
- 关键业务逻辑必须包含中间步骤的日志输出

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
- CI/CD管道强制执行测试覆盖率和linting规则
- 定期（季度）审查constitution的有效性和相关性
- 违反constitution的代码不得合并到主分支

---

## Enforcement

违反本宪章的代码或流程将：
1. 在PR审查中被拒绝
2. 在CI/CD中失败
3. 需要重新设计以符合原则

本宪章是项目的最高技术法律，所有决策必须以此为准。
