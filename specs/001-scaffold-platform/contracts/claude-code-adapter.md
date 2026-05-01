# 接口契约：Claude Code 适配器

**日期**: 2026-04-30

## 概述

Claude Code 适配器封装了与 Claude Code CLI/SDK 的所有交互，为上层服务提供统一的 AI 调用接口。

## 接口定义

### IClaudeCodeAdapter

```typescript
interface IClaudeCodeAdapter {
  // 基础调用
  execute(prompt: string, options: ClaudeCodeOptions): Promise<ClaudeCodeResult>;

  // 流式调用（用于实时展示 AI 输出）
  executeStream(
    prompt: string,
    options: ClaudeCodeOptions,
    onMessage: (message: StreamMessage) => void,
  ): Promise<ClaudeCodeResult>;

  // 会话管理
  continueSession(sessionId: string, prompt: string): Promise<ClaudeCodeResult>;

  // 能力查询
  getCapabilities(): AdapterCapabilities;
}
```

### ClaudeCodeOptions

```typescript
interface ClaudeCodeOptions {
  cwd: string;                    // 工作目录（项目路径）
  maxTurns?: number;              // 最大轮次（默认 10）
  allowedTools?: string[];        // 允许的工具列表
  disallowedTools?: string[];     // 禁止的工具列表
  systemPrompt?: string;          // 自定义系统提示
  appendSystemPrompt?: string;    // 追加系统提示
  model?: string;                 // 模型选择
}
```

### ClaudeCodeResult

```typescript
interface ClaudeCodeResult {
  sessionId: string;              // 会话 ID（用于继续对话）
  messages: Message[];            // 完整消息列表
  tokenUsage: TokenUsage;         // Token 使用统计
  exitReason: 'completed' | 'max_turns' | 'error';
}

interface StreamMessage {
  type: 'init' | 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  content: any;
  timestamp: number;
}
```

## 能力边界

| 能力 | 支持情况 |
|------|----------|
| 非交互式调用 | ✅ 通过 `-p` 标志 |
| 流式输出 | ✅ `stream-json` 格式 |
| 工具调用拦截 | ✅ 通过 Hooks 系统 |
| 工具白名单/黑名单 | ✅ `--allowedTools` / `--disallowedTools` |
| 自定义系统提示 | ✅ `--system-prompt` |
| 会话恢复 | ✅ `-c` / `-r` |
| 多模态输入 | ❌ stdin 仅支持文本 |
| HTTP 服务器模式 | ❌ 仅子进程调用 |
| 强制激活指定 Skill | ❌ Skills 由模型自动选择 |
