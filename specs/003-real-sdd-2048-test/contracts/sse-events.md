# SSE Event Contract: SDD 流式输出

**Date**: 2026-05-04
**Feature**: specs/003-real-sdd-2048-test

## 事件类型

### init

Claude Code 会话初始化。

```json
{
  "type": "init",
  "content": { "session_id": "string" },
  "timestamp": 1234567890
}
```

### assistant

Claude 的文本输出（思维过程、解释、进度说明）。

```json
{
  "type": "assistant",
  "content": "string (Claude 的文字输出)",
  "timestamp": 1234567890
}
```

### tool_use

Claude 调用工具（文件操作、Bash 命令等）。

```json
{
  "type": "tool_use",
  "content": {
    "tool": "Write | Read | Edit | Bash | Glob | Grep",
    "input": { "file_path": "...", "content": "..." }
  },
  "timestamp": 1234567890
}
```

### tool_result

工具执行结果。

```json
{
  "type": "tool_result",
  "content": {
    "tool": "Write | Read | ...",
    "output": "string",
    "success": true
  },
  "timestamp": 1234567890
}
```

### result

SDD 步骤最终结果（对应各 API 的 data 字段）。

```json
{
  "type": "result",
  "content": {
    "specFilePath": "string",
    "content": "string (完整 Markdown)",
    "tokenUsage": { "input": 0, "output": 0 },
    "exitReason": "completed | error | max_turns"
  },
  "timestamp": 1234567890
}
```

### [DONE]

流结束信号（无 JSON，纯文本 `data: [DONE]\n\n`）。

## 前端处理规则

1. `init` → 记录 `session_id`，显示"正在启动..."
2. `assistant` → 追加到日志/进度区域
3. `tool_use` → 显示当前操作（如"正在写入 spec.md..."）
4. `tool_result` → 短暂显示操作结果
5. `result` → 加载 `content` 到 Markdown 编辑器，停止 loading
6. `[DONE]` → 关闭 SSE 连接
