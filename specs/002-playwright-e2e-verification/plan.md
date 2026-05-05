# 实施计划：Playwright E2E 全功能浏览器自动化验证

**Branch**: `001-scaffold-platform` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: 功能规格说明来自 `/specs/002-playwright-e2e-verification/spec.md`

## 概要

为 SpecScaffold Web 平台的现有全部功能编写 Playwright E2E 测试，通过浏览器自动化验证所有页面和功能可通过浏览器操作触达。同时补充缺失的安全策略管理前端页面（US8），使安全管理功能形成完整闭环。

## 技术上下文

**语言/版本**: TypeScript 5.7+
**主要依赖**: @playwright/test, React 18, Ant Design, Hono, better-sqlite3
**存储**: SQLite（独立 E2E 测试数据库）
**测试框架**: Playwright（Chromium, headless 模式）
**目标平台**: 本地开发环境（浏览器 + Node.js 后端）
**项目类型**: Web 应用（前后端分离 monorepo）
**性能目标**: 全部 E2E 测试在 5 分钟内完成
**约束**: 仅 Chromium，无 Firefox/WebKit；SDD/AI 操作 mock 外部服务
**规模**: 8 个页面路由，8 个测试文件，约 30+ 测试用例

## 宪法检查

*门控: 必须在 Phase 0 研究前通过。Phase 1 设计后重新检查。*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. TDD 优先 | ✅ 通过 | E2E 测试本身即为测试优先；安全策略页面先编写 E2E 测试再实现页面 |
| II. 工具接口化 | ✅ 通过 | Playwright 通过标准 fixture/test API 集成；SDD/AI 通过 API mock 隔离 |
| III. 规格驱动 | ✅ 通过 | 完整 spec.md 已存在，本计划基于规格生成 |
| IV. Web 图形化优先 | ✅ 通过 | 全部通过浏览器 UI 操作验证 |
| V. 接入前充分认知 | ✅ 通过 | research.md 已完成 Playwright 集成模式调研 |
| VI. 功能提交纪律 | ✅ 通过 | 每个测试文件和页面实现独立提交 |
| VII. 中文文档规范 | ✅ 通过 | 所有文档使用中文 |

## 项目结构

### 文档（本功能）

```text
specs/002-playwright-e2e-verification/
├── plan.md              # 本文件
├── spec.md              # 功能规格
├── research.md          # 技术调研
├── data-model.md        # 测试数据模型
├── quickstart.md        # 快速上手
├── contracts/
│   ├── e2e-api-mocks.md         # API Mock 定义
│   └── security-policy-page.md  # 安全策略页面契约
└── checklists/
    └── requirements.md          # 规格质量检查
```

### 源代码（仓库根目录）

```text
# Playwright 配置
playwright.config.ts                      # Playwright 主配置

# E2E 测试文件
frontend/e2e/
├── fixtures/
│   ├── test-data.ts                      # 测试数据工厂（创建项目/任务/日志）
│   └── api-mocks.ts                      # SDD/AI API mock 响应定义
├── home.spec.ts                          # US1 首页项目列表与导航
├── project-create.spec.ts                # US2 创建脚手架项目
├── project-import.spec.ts                # US3 导入现有项目
├── sdd-flow.spec.ts                      # US4 SDD 规格驱动开发流程
├── ai-workspace.spec.ts                  # US5 AI 集成工作区操作
├── task-board.spec.ts                    # US6 任务面板状态流转
├── audit-log.spec.ts                     # US7 安全审计日志查看
└── security-policy.spec.ts               # US8 安全策略查看与更新

# 新增前端页面（补充 US8 安全策略管理能力）
frontend/src/
├── pages/
│   └── SecurityPolicy.tsx                # 安全策略管理页面
├── App.tsx                               # 新增 /projects/:id/security 路由
└── components/
    └── common/
        └── Layout.tsx                    # 导航菜单可能需要更新
```

**结构决策**: E2E 测试文件放在 `frontend/e2e/` 目录下（非 `frontend/tests/`，避免与现有 Vitest 测试混淆），Playwright 配置放在项目根目录以便管理前后端启动。

## 复杂度跟踪

无宪法违规需要记录。
