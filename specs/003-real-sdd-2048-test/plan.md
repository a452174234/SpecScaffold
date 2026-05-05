# Implementation Plan: SDD 流程接入 Spec Kit 技能

**Branch**: `001-scaffold-platform` | **Date**: 2026-05-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-real-sdd-2048-test/spec.md`

## Summary

将后端 `SpeckitAdapter` 从空壳（仅读磁盘文件）改造为通过 Claude Code SDK 直接调用 Spec Kit 技能（`/speckit-specify` 等）的驱动器。同时重写前端 `SddFlow.tsx`，实现步骤自动推进、产出可编辑、流式实时输出、任务可调整可执行。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24.x
**Primary Dependencies**: Hono 4.7 (后端), React 19 + Ant Design 6 (前端), `@anthropic-ai/claude-code` SDK (Claude 驱动)
**Storage**: SQLite (better-sqlite3), 文件系统 (specs/ 目录下的 .md 文件)
**Testing**: Vitest (后端单元测试), Playwright (E2E 测试)
**Target Platform**: Web 浏览器 (前端), Node.js 服务端 (后端)
**Project Type**: Web 应用 (monorepo: backend/ + frontend/)
**Performance Goals**: 单用户 SDD 流程，无高并发需求；Claude 调用为主要耗时（单步 1-3 分钟）
**Constraints**: Claude Code SDK 调用为阻塞式长操作，需 SSE 流式输出避免前端超时
**Scale/Scope**: 单用户本地开发工具，无分布式部署需求

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TDD 优先 | PASS | 每个 adapter 方法和前端交互都有对应测试用例（后端单元测试 + E2E 集成测试） |
| II. 工具接口化 | PASS | `SpeckitAdapter` 本身是适配器层，内部通过 `IClaudeCodeAdapter` 接口调用 SDK；新增方法不改变接口契约 |
| III. 规格驱动 | PASS | 本功能的 spec 已完成并通过 clarify |
| IV. Web 图形化优先 | PASS | 所有 SDD 交互通过 Web 界面（SddFlow.tsx），前端 Markdown 编辑器展示产出 |
| V. 接入前充分认知 | PASS | 已完成 Claude Agent SDK 官方文档研究，确认 Skills 加载机制、allowedTools 配置、流式输出方式 |
| VI. 功能提交纪律 | PASS | 每个功能完成后独立提交 |
| VII. 中文文档规范 | PASS | 所有文档和 UI 文案使用中文 |

## Project Structure

### Documentation (this feature)

```text
specs/003-real-sdd-2048-test/
├── plan.md              # 本文件
├── research.md          # Phase 0: 技术调研
├── data-model.md        # Phase 1: 数据模型
├── quickstart.md        # Phase 1: 快速验证指南
├── contracts/           # Phase 1: API 契约
│   ├── sdd-api.md       # SDD API 端点契约
│   └── sse-events.md    # SSE 事件契约
└── tasks.md             # /speckit-tasks 生成
```

### Source Code (repository root)

```text
backend/src/
├── adapters/
│   ├── claude-code/
│   │   ├── adapter.ts        # 不变 — SDK 封装，支持 execute/executeStream
│   │   └── types.ts          # 不变 — ClaudeCodeOptions, ClaudeCodeResult, StreamMessage
│   └── speckit/
│       ├── adapter.ts        # 重写 — SDK 技能调用器（核心变更）
│       └── types.ts          # 扩展 — 增加 content, sessionId, tokenUsage 字段
├── services/
│   ├── sdd-service.ts        # 修改 — 使用新 adapter，支持流式、内容持久化
│   └── ai-service.ts         # 不变
├── api/routes/
│   ├── sdd.ts                # 修改 — 新增 SSE 流式端点、内容保存端点
│   └── ai.ts                 # 不变
├── services/
│   └── project-service.ts    # 修改 — 导入项目时同步 .claude/skills/ 到项目目录
└── db/
    └── index.ts              # 修改 — 增加数据库字段迁移

frontend/src/
├── pages/
│   ├── SddFlow.tsx           # 重写 — 步骤自动推进、Markdown 编辑器、流式显示
│   └── AiWorkspace.tsx       # 不变
└── services/
    └── api.ts                # 扩展 — SSE 流式请求支持、内容保存 API
```

**Structure Decision**: 沿用现有 monorepo 结构（backend/ + frontend/），不新增顶层目录。变更集中在 `adapters/speckit/`（重写）、`api/routes/sdd.ts`（扩展端点）、`pages/SddFlow.tsx`（重写）。

## Complexity Tracking

无 Constitution 违规，不需要记录。
