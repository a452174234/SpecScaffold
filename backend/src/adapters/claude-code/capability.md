# Claude Code 能力边界文档

**版本**: v1.0.0
**日期**: 2026-05-01

## 概述

Claude Code 是 Anthropic 提供的 AI 编程助手 CLI 工具。本平台通过 TypeScript SDK (`@anthropic-ai/claude-code`) 集成，使用 `stream-json` 输出格式实现实时展示。

## 支持的能力

| 能力 | 方法 | 说明 |
|------|------|------|
| 执行命令 | `execute()` | 发送 prompt，获取完整响应 |
| 流式执行 | `executeStream()` | 实时推送 AI 输出消息 |
| 继续会话 | `continueSession()` | 在已有会话上追加指令 |

## 调用方式

```typescript
const adapter = new ClaudeCodeAdapter();
const result = await adapter.execute('生成登录模块的测试用例', {
  cwd: '/path/to/project',
  maxTurns: 10,
  appendSystemPrompt: '遵循 TDD 流程',
});
```

## 限制

- **依赖 Claude Code CLI**: 需要用户预先安装并登录 Claude Code
- **并发限制**: 同一会话同时只能处理一个请求
- **Token 消耗**: 大型任务可能消耗大量 token
- **执行时间**: 复杂任务可能需要较长时间
- **本地运行**: Claude Code 在本地执行，需要网络连接

## 安全集成

Claude Code 的 `PreToolUse` Hook 机制用于安全围栏：
- 平台在启动 Claude Code 会话前配置 Hook
- Hook 拦截所有工具调用，调用安全围栏 API 评估
- 返回 allow/deny/ask 控制执行
