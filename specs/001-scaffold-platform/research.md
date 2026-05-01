# 技术调研：SpecScaffold Web 脚手架平台

**日期**: 2026-04-30
**分支**: `001-scaffold-platform`

## 调研一：Claude Code CLI 集成方式

### 决策：使用 TypeScript SDK + 流式 JSON 输出

### 理由

1. SpecScaffold 后端使用 TypeScript，TypeScript SDK（`@anthropic-ai/claude-code`）是最自然的集成方式
2. `stream-json` 输出格式支持实时获取 AI 响应，适合 Web 界面的实时展示需求
3. SDK 封装了子进程管理，比手动调用 CLI 更可靠

### 调用方式

```typescript
import { claude } from '@anthropic-ai/claude-code';

const result = await claude({
  prompt: "用户的功能描述",
  outputFormat: "stream-json",
  maxTurns: 10,
  cwd: "/path/to/project",
});
```

### 备选方案

| 方案 | 优劣 |
|------|------|
| TypeScript SDK（选中） | 类型安全，与后端技术栈一致，官方维护 |
| CLI 子进程调用 | 更底层，需要手动解析输出，但更灵活 |
| Python SDK | 需额外语言运行时，不符合项目技术栈 |

### 关键能力

- 非交互模式：`-p` 标志
- 输出格式：`text` / `json` / `stream-json`
- 工具限制：`--allowedTools` / `--disallowedTools`
- 自定义权限：`--permission-prompt-tool`（通过 MCP 工具处理权限）
- Hooks 系统：`PreToolUse` 可拦截工具调用
- 会话管理：`-c` 继续 / `-r` 恢复 / session ID
- 自定义提示：`--system-prompt` / `--append-system-prompt`

### 已知限制

- 无 HTTP 服务器模式，只能作为子进程调用
- `--system-prompt` 仅限 `--print` 模式
- 需要 Node.js 运行时
- Hook 修改需重启生效

## 调研二：Spec Kit Skills 集成方式

### 决策：通过 Claude Code CLI 间接调用 Spec Kit Skills

### 理由

1. Spec Kit 以 Claude Code Skills 形式集成（`.claude/skills/speckit-*`）
2. Skills 由 Claude Code 自动发现和调用，无需独立安装
3. 每个 Skill 生成标准化的文件输出，Web 后端通过文件系统读取结果

### 调用链

```
Web 后端 → Claude Code TypeScript SDK → Claude Code CLI → Spec Kit Skills → 文件输出
Web 后端 ← 读取生成的文件 ← specs/ 目录
```

### Spec Kit 核心 Skills

| Skill | 功能 | 输入 | 输出文件 |
|-------|------|------|----------|
| specify | 创建功能规范 | 自然语言描述 | `spec.md`, `checklists/` |
| clarify | 澄清规范歧义 | 补充说明 | 更新 `spec.md` |
| plan | 生成实施计划 | 可选指导 | `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| tasks | 生成任务列表 | 可选约束 | `tasks.md` |
| implement | 执行实现 | 可选指导 | 源码文件 |
| analyze | 一致性分析 | 无 | 分析报告 |
| checklist | 生成检查清单 | 需求描述 | `checklists/` |

### 备选方案

| 方案 | 优劣 |
|------|------|
| 通过 Claude Code 间接调用（选中） | 自然集成，利用 Skills 自动发现 |
| 直接调用 Spec Kit CLI | Spec Kit 没有独立 CLI，必须通过 Claude Code |
| 独立实现 SDD 流程 | 工作量大，重复造轮子 |

## 调研三：安全围栏实现方案

### 决策：使用 Claude Code Hooks + 自定义权限工具双层防护

### 理由

1. Claude Code 的 `PreToolUse` Hook 可以拦截所有工具调用
2. `--permission-prompt-tool` 支持通过 MCP 工具处理权限决策
3. 结合平台安全策略，实现项目内/外的操作分级管控

### 架构

```
AI 操作请求
    ↓
Claude Code 内部权限检查
    ↓ (需要审批时)
PreToolUse Hook → 平台安全围栏服务
    ↓
├─ 只读/低危操作 → 放行
├─ 高危操作 → 暂停 → 展示给用户 → 审批/拒绝
└─ 项目外写操作 → 直接拒绝
    ↓
审批结果注入回 AI 上下文
    ↓
审计日志记录
```

### 实现机制

1. **动态生成 hooks 配置**：每次启动 Claude Code 会话时，根据项目安全策略生成 `settings.json` 中的 hooks
2. **自定义 Hook 脚本**：编写 Hook 脚本调用平台安全围栏 API 判断操作级别
3. **WebSocket 推送**：高危操作通过 WebSocket 推送到前端，展示操作说明并等待用户响应
4. **审批结果回传**：用户审批后通过文件或 API 回传给 Hook 脚本，Hook 返回 allow/deny

### 备选方案

| 方案 | 优劣 |
|------|------|
| Hooks + 自定义权限工具（选中） | 利用 Claude Code 原生机制，可靠性高 |
| 纯 `--allowedTools` 白名单 | 粒度太粗，无法区分高危/低危 |
| 包装 Claude Code 输出过滤 | 只能过滤最终输出，无法拦截中间操作 |

## 调研四：技术栈选型

### 决策：TypeScript + Bun + React + SQLite

### 理由

1. TypeScript 与 Claude Code 生态系统完全对齐
2. Bun 性能优于 Node.js，且原生支持 TypeScript
3. React 生态成熟，组件库丰富，适合构建复杂 UI
4. SQLite 轻量级，适合单用户本地部署场景

### 技术栈明细

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| 运行时 | Bun | 性能好，原生 TS 支持 |
| 后端框架 | Hono | 轻量，兼容 Bun，API 设计简洁 |
| 前端框架 | React 18 | 生态成熟，社区支持强 |
| UI 组件库 | Ant Design / Shadcn UI | 中文友好，组件丰富 |
| 状态管理 | Zustand | 轻量，适合中小型应用 |
| 数据库 | SQLite (better-sqlite3) | 零配置，适合本地工具 |
| 数据验证 | Zod | TypeScript 优先，类型安全 |
| 实时通信 | WebSocket (Bun 原生) | 审计推送 + AI 输出流式展示 |
| 测试 | Vitest + Playwright | 快速，与 Bun 兼容 |
| 构建 | Vite | 前端构建快，开发体验好 |

### 备选方案

| 方案 | 拒绝理由 |
|------|----------|
| Python (FastAPI) + React | 与 Claude Code 生态不对齐 |
| Next.js 全栈 | 全栈框架过于重，本项目是工具不是 Web 产品 |
| Electron | 过于重量级，浏览器访问 localhost 更轻便 |
