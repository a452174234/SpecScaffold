# Data Model: SDD 流程接入 Spec Kit 技能

**Date**: 2026-05-04
**Feature**: specs/003-real-sdd-2048-test

## 现有实体变更

### specs 表（新增字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| content | TEXT | spec.md 的完整 Markdown 内容 |
| session_id | TEXT | Claude Code SDK 的 session ID，用于 SSE 重连和 continueSession |
| token_usage | TEXT | JSON 格式 `{"input": N, "output": N}` |

**状态流转**: `draft` → `clarified` → `planned` → `tasked`（不变）

### plans 表（新增字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| content | TEXT | plan.md 的完整 Markdown 内容 |
| session_id | TEXT | Claude Code SDK 的 session ID |
| token_usage | TEXT | JSON 格式 `{"input": N, "output": N}` |

### tasks 表（新增字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| order_index | INTEGER | 任务执行顺序（从 tasks.md 解析） |
| content | TEXT | 任务详细内容（从 tasks.md 解析的单条任务描述） |

### projects 表（无结构变更）

导入/创建项目时新增副作用：在项目目录下创建 `.claude/` junction 指向 SpecScaffold 平台的 `.claude/` 目录。

## 新增运行时实体（非持久化）

### SddJob（内存中追踪）

| 字段 | 类型 | 说明 |
|------|------|------|
| projectId | string | 关联项目 ID |
| step | 'specify' \| 'clarify' \| 'plan' \| 'tasks' \| 'implement' | 当前步骤 |
| status | 'running' \| 'completed' \| 'failed' | 执行状态 |
| sessionId | string | Claude Code session ID |
| startedAt | number | 开始时间戳 |
| result | any | 完成后的结果（spec 内容、plan 内容等） |

**用途**: SSE 中断后前端重连时，通过 `projectId + step` 查找内存中的 job 状态，返回已完成的结果。

**生命周期**: Job 在后端内存中维持直到结果被前端消费或超时（30 分钟）。不持久化到数据库——如果后端重启，进行中的 job 丢失，前端需重新触发。
