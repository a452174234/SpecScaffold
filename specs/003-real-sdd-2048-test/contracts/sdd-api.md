# API Contract: SDD 端点

**Date**: 2026-05-04
**Feature**: specs/003-real-sdd-2048-test

## 现有端点（修改）

### POST /api/projects/:id/sdd/specify

**Request**:
```json
{ "description": "string" }
```

**Response**（变更：增加 content, sessionId, tokenUsage）:
```json
{
  "success": true,
  "data": {
    "specId": "uuid",
    "specFilePath": "specs/003-xxx/spec.md",
    "featureDirectory": "specs/003-xxx",
    "checklistPath": "specs/003-xxx/checklists",
    "content": "# Feature Specification: ...\n（完整 Markdown 内容）",
    "tokenUsage": { "input": 1000, "output": 2000 },
    "sessionId": "claude-session-id",
    "exitReason": "completed"
  }
}
```

### POST /api/projects/:id/sdd/clarify

**Request**:
```json
{ "clarification": "string (optional)" }
```

**Response**（变更：增加 content, sessionId）:
```json
{
  "success": true,
  "data": {
    "specFilePath": "specs/003-xxx/spec.md",
    "content": "# Feature Specification: ...\n（更新后的完整 Markdown）",
    "tokenUsage": { "input": 500, "output": 1000 },
    "sessionId": "claude-session-id"
  }
}
```

### POST /api/projects/:id/sdd/plan

**Request**:
```json
{ "guidance": "string (optional)" }
```

**Response**（变更：增加 content, sessionId）:
```json
{
  "success": true,
  "data": {
    "planId": "uuid",
    "planFilePath": "specs/003-xxx/plan.md",
    "researchFilePath": "specs/003-xxx/research.md",
    "dataModelFilePath": "specs/003-xxx/data-model.md",
    "contractsDirectory": "specs/003-xxx/contracts",
    "quickstartFilePath": "specs/003-xxx/quickstart.md",
    "content": "# Implementation Plan: ...\n（完整 Markdown 内容）",
    "tokenUsage": { "input": 2000, "output": 3000 },
    "sessionId": "claude-session-id"
  }
}
```

### POST /api/projects/:id/sdd/tasks

**Request**:
```json
{ "constraints": "string (optional)" }
```

**Response**（变更：增加 content, sessionId）:
```json
{
  "success": true,
  "data": {
    "tasksFilePath": "specs/003-xxx/tasks.md",
    "taskCount": 15,
    "content": "## Phase 1: Setup\n- [ ] T001 ...\n（完整 Markdown 内容）",
    "tokenUsage": { "input": 1500, "output": 2500 },
    "sessionId": "claude-session-id"
  }
}
```

## 新增端点

### POST /api/projects/:id/sdd/:step/stream

SSE 流式端点，`:step` 为 `specify | clarify | plan | tasks | implement`。

**Request**:
```json
{
  "description": "string (specify 时必填)",
  "clarification": "string (clarify 时可选)",
  "guidance": "string (plan 时可选)",
  "constraints": "string (tasks 时可选)"
}
```

**Response**: `text/event-stream`

```
data: {"type":"init","content":{"session_id":"xxx"},"timestamp":1234567890}

data: {"type":"assistant","content":"正在加载 Spec Kit 技能...","timestamp":1234567891}

data: {"type":"tool_use","content":{"tool":"Write","input":{"file_path":"specs/003-xxx/spec.md"}},"timestamp":1234567892}

data: {"type":"result","content":{"specFilePath":"...","content":"...","tokenUsage":{...}},"timestamp":1234567899}

data: [DONE]
```

### POST /api/projects/:id/sdd/content/save

保存用户编辑后的内容到磁盘。

**Request**:
```json
{
  "step": "specify | clarify | plan | tasks",
  "content": "string (完整 Markdown 内容)"
}
```

**Response**:
```json
{ "success": true, "data": { "filePath": "specs/003-xxx/spec.md" } }
```

### GET /api/projects/:id/sdd/status

查询当前项目的 SDD 流程状态（用于 SSE 重连后恢复）。

**Response**:
```json
{
  "success": true,
  "data": {
    "spec": { "status": "clarified", "content": "..." },
    "plan": { "status": "draft", "content": "..." },
    "taskCount": 15,
    "activeJob": null
  }
}
```

### POST /api/projects/:id/sdd/implement

执行任务（调用 `/speckit-implement` 技能）。

**Request**:
```json
{ "taskIds": ["T001", "T002"] }
```

**Response**:
```json
{
  "success": true,
  "data": {
    "completedTasks": 2,
    "failedTasks": 0,
    "changedFiles": ["src/xxx.ts"],
    "tokenUsage": { "input": 5000, "output": 8000 },
    "sessionId": "claude-session-id"
  }
}
```
