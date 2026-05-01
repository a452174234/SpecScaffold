# 实施计划：SpecScaffold Web 脚手架平台

**分支**: `001-scaffold-platform` | **日期**: 2026-04-30 | **规格**: [spec.md](spec.md)
**输入**: 功能规格说明来自 `/specs/001-scaffold-platform/spec.md`

## 概要

构建一个基于 Harness Engineering 理念的 Web 端图形化脚手架平台。v1 版本集成 Claude Code（AI 模型）和 Spec Kit（SDD 引擎），强制执行 TDD 工作流，实现安全围栏与操作审计。平台以本地 Web 服务形态运行，支持新建项目和导入现有项目进行迭代开发。

## 技术上下文

**语言/版本**: TypeScript 5.x + Bun 运行时（与 Claude Code 生态对齐）
**主要依赖**: React 18, Hono/Fastify（后端）, SQLite（审计日志与项目状态）, Zod（数据验证）
**存储**: SQLite（平台数据库，存储项目信息、审计日志、安全策略）
**测试**: Vitest（单元/集成测试）, Playwright（E2E 测试）
**目标平台**: Web 浏览器（本地部署，localhost 访问）
**项目类型**: Web 应用（前后端分离）
**性能目标**: Spec 生成 < 60s，审计请求展示 < 2s，页面加载 < 3s
**约束**: 本地单用户部署，仅支持 macOS/Windows/Linux 桌面环境
**规模/范围**: 单用户开发者工具，5-8 个核心页面

## 宪法检查

*关卡：必须在 Phase 0 研究前通过。Phase 1 设计后复检。*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. TDD 优先 | ✅ 通过 | 计划包含测试优先的构建阶段 |
| II. 工具接口化 | ✅ 通过 | Claude Code 和 Spec Kit 通过 Adapter 层集成 |
| III. 规格驱动 | ✅ 通过 | 本文档即为 Spec → Plan 流程的产物 |
| IV. Web 图形化优先 | ✅ 通过 | 全部用户交互通过 Web 界面 |
| V. 接入前充分认知 | ✅ 通过 | research.md 已完成 Claude Code 和 Spec Kit 的能力边界分析 |
| VI. 功能提交纪律 | ✅ 通过 | 任务工作流中强制 TDD 通过后自动 Git 提交 |
| VII. 中文文档规范 | ✅ 通过 | 所有文档使用中文编写 |

## 项目结构

### 文档（本功能）

```text
specs/001-scaffold-platform/
├── plan.md              # 本文件
├── spec.md              # 功能规格说明
├── research.md          # Phase 0 输出：技术调研
├── data-model.md        # Phase 1 输出：数据模型
├── quickstart.md        # Phase 1 输出：快速上手指南
├── contracts/           # Phase 1 输出：接口契约
│   ├── claude-code-adapter.md   # Claude Code 适配器契约
│   ├── speckit-adapter.md       # Spec Kit 适配器契约
│   ├── security-fence.md        # 安全围栏契约
│   └── api.md                   # 后端 API 契约
└── tasks.md             # Phase 2 输出（/speckit-tasks 生成）
```

### 源码（仓库根目录）

```text
backend/
├── src/
│   ├── adapters/            # 外部工具适配器
│   │   ├── claude-code/     # Claude Code CLI 适配器
│   │   │   ├── adapter.ts
│   │   │   ├── types.ts
│   │   │   └── capability.md
│   │   ├── speckit/         # Spec Kit Skills 适配器
│   │   │   ├── adapter.ts
│   │   │   ├── types.ts
│   │   │   └── capability.md
│   │   └── registry.ts      # 适配器注册表
│   ├── core/                # 核心引擎
│   │   ├── engine.ts        # SDD + TDD 流程引擎
│   │   ├── project.ts       # 项目管理
│   │   └── workflow.ts      # 工作流状态机
│   ├── security/            # 安全围栏
│   │   ├── fence.ts         # 操作拦截与分级
│   │   ├── policy.ts        # 安全策略管理
│   │   └── audit.ts         # 审计日志
│   ├── models/              # 数据模型
│   │   ├── project.ts
│   │   ├── spec.ts
│   │   ├── task.ts
│   │   └── audit-log.ts
│   ├── services/            # 业务服务
│   │   ├── project-service.ts
│   │   ├── sdd-service.ts
│   │   ├── ai-service.ts
│   │   ├── tdd-service.ts
│   │   └── security-service.ts
│   ├── api/                 # API 路由
│   │   ├── routes/
│   │   └── middleware/
│   └── main.ts              # 入口
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── src/
│   ├── components/          # UI 组件
│   │   ├── project/         # 项目创建/导入
│   │   ├── sdd/             # SDD 流程组件
│   │   ├── tdd/             # TDD 工作流组件
│   │   ├── ai/              # AI 执行与结果展示
│   │   ├── security/        # 安全围栏与审计
│   │   └── common/          # 通用组件
│   ├── pages/               # 页面
│   │   ├── Home.tsx         # 首页（项目列表）
│   │   ├── ProjectCreate.tsx
│   │   ├── ProjectImport.tsx
│   │   ├── SddFlow.tsx      # SDD 流程页
│   │   ├── TaskBoard.tsx    # 任务面板
│   │   ├── AiWorkspace.tsx  # AI 工作区
│   │   └── AuditLog.tsx     # 审计日志
│   ├── services/            # API 调用
│   ├── stores/              # 状态管理
│   └── App.tsx
└── tests/
```

**结构决策**: 采用前后端分离的 Web 应用结构。后端使用 TypeScript + Bun，
前端使用 React。后端通过 Adapter 层调用 Claude Code CLI 和 Spec Kit Skills，
安全围栏作为中间层拦截所有 AI 操作。

## 复杂度跟踪

> 宪法检查无违规，无需填写此表。
