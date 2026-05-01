# 快速上手指南：SpecScaffold Web 脚手架平台

**日期**: 2026-05-01

## 环境要求

- **Node.js** >= 18
- **Claude Code CLI** 已安装并认证（可选，AI 功能依赖）
- **Git** 已安装
- 操作系统：Windows / macOS / Linux

## 安装

```bash
# 克隆仓库
git clone <repo-url> spec-scaffold
cd spec-scaffold

# 安装根依赖
npm install

# 安装后端依赖
cd backend && npm install && cd ..

# 安装前端依赖
cd frontend && npm install && cd ..

# 初始化数据库
npm run db:init
```

## 启动

```bash
# 同时启动后端 + 前端开发服务器
npm run dev

# 后端默认运行在 http://localhost:3000
# 前端默认运行在 http://localhost:5173
```

也可以分别启动：

```bash
# 只启动后端
npm run dev:backend

# 只启动前端
npm run dev:frontend
```

## 基本使用流程

### 1. 创建/导入项目

1. 打开 http://localhost:5173
2. 点击「新建项目」或「导入项目」
3. 填写项目名称和路径
4. 项目创建/导入完成

### 2. SDD 规格驱动开发

1. 选择项目 → 进入 SDD 流程页面
2. 输入功能描述 → 点击「生成功能规格」
3. （可选）输入澄清内容 → 点击「提交澄清」
4. 点击「生成计划」→ 等待 Plan 生成
5. 点击「生成任务」→ 查看任务列表

### 3. AI + TDD 开发

1. 选择任务 → 进入 AI 工作区
2. 点击「生成测试（Red）」→ AI 生成测试用例
3. 审查测试代码 → 确认测试
4. 点击「实现代码（Green）」→ AI 实现业务代码
5. 安全围栏拦截高危操作时，前端弹出审批面板
6. 审批/拒绝操作 → 等待 AI 完成
7. 点击「运行测试」→ 验证实现
8. 测试通过 → 系统自动 Git 提交

### 4. 安全围栏与审计

- 所有 AI 操作自动经过安全围栏评估
- 只读操作自动放行，高危操作需用户审批
- 审计日志页面可查看所有操作历史

## 运行测试

```bash
# 运行全部测试（53 个测试用例）
npm test

# 监视模式
npm run test:watch

# 特定模块
npx vitest run backend/tests/unit/security/
```

## API 端点一览

| 端点 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET/POST /api/projects` | 项目列表/创建 |
| `POST /api/projects/import` | 导入已有项目 |
| `GET /api/projects/:id` | 项目详情 |
| `POST /api/projects/:id/specify` | 生成功能规格 |
| `POST /api/projects/:id/plan` | 生成实施计划 |
| `POST /api/projects/:id/tasks` | 生成任务列表 |
| `POST /api/projects/:id/ai/generate-tests` | AI 生成测试 |
| `POST /api/projects/:id/ai/implement` | AI 实现代码 |
| `GET /api/projects/:id/security/policy` | 安全策略 |
| `GET /api/projects/:id/audit-logs` | 审计日志 |
| `POST /api/audit/evaluate` | 安全围栏评估 |
