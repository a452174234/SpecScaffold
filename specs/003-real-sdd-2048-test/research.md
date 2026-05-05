# Technical Research: SDD 流程接入 Spec Kit 技能

**Date**: 2026-05-04
**Feature**: specs/003-real-sdd-2048-test

## R1: Claude Agent SDK Skills 调用机制

**Decision**: 通过 SDK `query()` 函数，以 prompt 形式发送 `/speckit-specify` 等技能调用命令

**Rationale**:
- 官方文档确认：`query()` 设置 `cwd` 后自动加载 `.claude/skills/` 下的技能
- `allowedTools` 包含 `"Skill"` 时 Claude 可自主发现和调用技能
- Slash Commands 可直接在 prompt 中以 `/command-name` 发送
- 技能内部的全部逻辑（模板加载、文件创建、质量检查、hooks）由 Claude Code 自动执行

**Alternatives considered**:
- 重写 prompt 等价于技能逻辑：维护成本高，技能更新后不同步，无质量校验
- CLI 子进程 `claude -p`：可行但需要处理进程管理、流式输出解析，不如 SDK 直接集成

**Key references**:
- https://code.claude.com/docs/en/agent-sdk/skills — Skills in SDK
- https://code.claude.com/docs/en/agent-sdk/slash-commands — Slash Commands in SDK
- https://code.claude.com/docs/en/agent-sdk/overview — Agent SDK Overview

## R2: Spec Kit 技能分发到用户项目

**Decision**: 项目导入/创建到 SpecScaffold 时，将 `.claude/skills/` symlink 到用户项目目录

**Rationale**:
- SDK 的技能发现基于 `cwd` 目录下的 `.claude/skills/`
- 用户项目路径（如 `D:\my-projects\2048-game\`）默认不包含技能
- Symlink 比 copy 更好：平台侧技能更新后无需重新分发
- Windows 上需使用 junction（`mklink /J`）代替 symlink，因为 junction 不需要管理员权限

**Alternatives considered**:
- `cwd` 设为平台目录 + systemPrompt 指定用户项目：违反 SDK 语义，Claude 的文件操作会作用于错误目录
- 全局安装 `~/.claude/skills/`：多用户场景下无法隔离，且需要额外配置

**Implementation note**: `ProjectService.create()` 和 `ProjectService.import()` 中增加一步：检测目标项目是否已有 `.claude/skills/`，没有则创建 junction 指向平台的 `.claude/skills/`。

## R3: SSE 流式输出实现

**Decision**: 使用 Hono 内置的 `c.stream()` 返回 SSE，后端通过 `ClaudeCodeAdapter.executeStream()` 获取实时消息

**Rationale**:
- Hono 原生支持 `c.stream()` 返回 Server-Sent Events
- `ClaudeCodeAdapter` 已有 `executeStream()` 方法，接受 `onMessage` 回调
- 每条 `StreamMessage` 包含 `type`（init/user/assistant/tool_use/tool_result/result）和 `content`

**Alternatives considered**:
- WebSocket：双向通信不必要，SDD 流程是单向推送
- 轮询：延迟高，实现复杂

**SSE 中断恢复策略**: 后端继续完成 Claude 调用（不取消），结果写入数据库。前端重连时通过新的端点获取已完成的结果。通过 `sessionId` 追踪每次 Claude 调用。

## R4: 非交互式 Clarify 适配

**Decision**: 调用 `/speckit-clarify` 时追加非交互指令，让 Claude 自动补充而非提问

**Rationale**:
- `/speckit-clarify` 默认逐个提问，最多 5 个问题，需要用户实时回答
- Web 后端无法实现交互式 Q&A（SSE 是单向推送）
- 替代方案：让 Claude 自动审查并补充合理推断，用户在前端编辑器中审阅和修改
- 追加指令：`"请自动审查并补充规格文档中不完整或模糊的部分，直接修改文件，不需要提问交互"`

**Alternatives considered**:
- WebSocket 实现交互式 Q&A：实现复杂度高，用户体验差（需等待每个问题的回答）
- 跳过 clarify 步骤：损失规格质量保证

## R5: 前端 Markdown 编辑器选型

**Decision**: 使用 `@uiw/react-md-editor`

**Rationale**:
- 轻量级（~50KB gzipped），React 19 兼容
- 支持 Markdown 编辑和预览双模式
- Ant Design 风格可通过 CSS 覆盖适配
- 社区活跃，维护良好

**Alternatives considered**:
- `react-markdown` + `CodeMirror`：组合复杂，需自己封装编辑器
- Monaco Editor：过于重量级，Markdown 编辑场景过重
