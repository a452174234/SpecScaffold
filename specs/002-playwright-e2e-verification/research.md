# 技术调研：Playwright E2E 全功能浏览器自动化验证

**日期**: 2026-05-03
**功能**: 002-playwright-e2e-verification

## 调研 1：Playwright 与现有项目集成模式

### 决策

Playwright 配置放置在**项目根目录**，通过 `webServer` 配置同时启动前后端服务。

### 理由

1. 项目根 `package.json` 已定义 `test:e2e` 脚本指向 `frontend/playwright.config.ts`，但考虑到需要同时管理前后端启动，根目录配置更合理
2. Playwright 需要启动前端（Vite dev server）和后端（Hono server）两个进程
3. 测试数据库管理需要访问后端数据库模块

### 备选方案

- **方案 A（已否决）**: 配置在 frontend/ 目录 — 需要额外的后端启动脚本，且数据准备需要跨目录操作
- **方案 B（已否决）**: 配置在 backend/ 目录 — 前端是测试的直接目标，不应放在后端

## 调研 2：前后端服务启动策略

### 决策

Playwright webServer 使用 `concurrently` 同时启动前后端，复用根 `package.json` 的 `dev` 脚本。

### 理由

- 根 `package.json` 已有 `"dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""` 脚本
- 前端 Vite dev server 默认端口 5173
- 后端 Hono server 默认端口 3000
- 通过环境变量 `PORT` 控制后端端口，E2E 测试使用不同端口避免冲突
- 通过环境变量 `TEST_DB_PATH` 使用独立测试数据库

### 关键配置参数

```
前端 dev server: http://localhost:5173
后端 API server: http://localhost:3000
WebSocket: ws://localhost:3000/ws
测试数据库: 环境变量控制独立路径
```

## 调研 3：SDD/AI 外部服务 Mock 策略

### 决策

使用 Playwright `page.route()` 拦截前端到后端的 API 请求，返回预定义的 mock 响应。

### 理由

1. **前端 API 层直接请求后端**（`http://localhost:3000/api`），无代理层，浏览器端拦截最直接
2. SDD 和 AI 服务通过适配器调用（`SpeckitAdapter`、`ClaudeCodeAdapter`），适配器内部使用 Claude Code SDK
3. Playwright route 拦截发生在浏览器内部，可以完全控制 API 响应，无需修改后端代码
4. Mock 响应可以精确控制每个测试场景的预期行为

### Mock 范围

| API 路径 | Mock 策略 |
|----------|-----------|
| `POST /api/projects/:id/sdd/*` | 返回成功/失败固定响应 |
| `POST /api/projects/:id/ai/*` | 返回成功/失败固定响应 |
| `GET/POST/PUT /api/projects*` | 不 mock，使用真实后端 |
| `GET /api/projects/:id/tasks*` | 不 mock，使用真实后端 |
| `GET /api/projects/:id/security/*` | 不 mock，使用真实后端 |

### 备选方案

- **方案 A（已否决）**: 后端注入 mock 适配器 — 需修改后端代码，违反"测试不应改变生产代码"原则
- **方案 B（已否决）**: 完全使用真实外部服务 — CI 环境中不可用，且违反 spec 假设

## 调研 4：测试数据准备策略

### 决策

使用 **API 驱动** 的数据准备方式，通过后端真实 API 创建测试数据。

### 理由

1. 已有完整的后端 API（项目 CRUD、任务管理、安全策略）
2. 通过 API 创建数据验证了完整的前后端链路
3. 数据创建和测试使用同一个浏览器上下文，状态一致
4. 每个测试使用独立的浏览器上下文（`test.use({ storageState: ... })`），确保隔离

### 数据准备流程

```
每个测试 → 新浏览器上下文 → 调用后端 API 创建数据 → 执行 UI 操作 → 验证结果 → 清理
```

### 备选方案

- **方案 A（已否决）**: 直接操作数据库 — 绕过后端验证逻辑，测试不完整
- **方案 B（已否决）**: Playwright storageState 复用登录态 — 项目无认证系统，不适用

## 调研 5：安全策略前端页面实现

### 决策

新增 `frontend/src/pages/SecurityPolicy.tsx` 页面和对应路由 `/projects/:id/security`，在项目详情页添加第五个导航卡片。

### 理由

1. 后端已有完整的 `GET/PUT /api/projects/:id/security/policy` API
2. 前端项目详情页目前有 4 个导航卡片，可自然扩展第 5 个
3. 使用 Ant Design 组件（Form、Input、Tag、Button）与现有页面风格一致
4. 页面功能：展示当前策略（高风险工具列表、只读工具列表）→ 支持编辑 → 保存更新

### 备选方案

- **方案 A（已否决）**: 将安全策略嵌入审计日志页面 — 职责不同，不应合并
- **方案 B（已否决）**: 使用模态框而非独立页面 — 策略配置内容较多，模态框空间不足

## 调研 6：测试文件组织结构

### 决策

按页面/功能模块组织测试文件，每个用户故事一个测试文件。

### 理由

1. 与前端页面结构一一对应，易于定位
2. 每个文件可独立运行，支持 `npx playwright test tests/home.spec.ts`
3. 共享的 fixture（数据准备、mock 响应）抽取到 `fixtures/` 目录

### 目录结构

```
frontend/e2e/
├── fixtures/
│   ├── test-data.ts          # 测试数据工厂函数
│   └── api-mocks.ts          # SDD/AI API mock 响应
├── home.spec.ts              # US1 首页
├── project-create.spec.ts    # US2 创建项目
├── project-import.spec.ts    # US3 导入项目
├── sdd-flow.spec.ts          # US4 SDD 流程
├── ai-workspace.spec.ts      # US5 AI 工作区
├── task-board.spec.ts        # US6 任务面板
├── audit-log.spec.ts         # US7 审计日志
└── security-policy.spec.ts   # US8 安全策略
```
