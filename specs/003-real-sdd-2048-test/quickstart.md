# Quickstart: SDD 流程验证指南

**Date**: 2026-05-04
**Feature**: specs/003-real-sdd-2048-test

## 验证步骤

### 1. 启动服务

```bash
# 后端
cd backend && npm run dev

# 前端（新终端）
cd frontend && npm run dev
```

### 2. 创建测试项目

浏览器打开 `http://localhost:5173`，点击"新建项目"，填入：
- 名称：`2048 游戏测试`
- 路径：选择一个空目录（如 `D:\test-projects\2048`）

**验证点**：项目目录下应自动创建 `.claude/skills/` junction（指向 SpecScaffold 平台）。

### 3. 启动 SDD 流程

进入项目详情页，点击"SDD 流程"，输入：
```
2048 小游戏：4x4 网格，方向键控制，数字合并，得分计算，单个 HTML 文件输出
```

点击"开始生成"。

**验证点**：
- 前端显示实时日志（assistant/tool_use/tool_result 事件）
- 日志中可见 Claude 加载 `/speckit-specify` 技能
- 完成后 Markdown 编辑器显示完整 spec.md 内容
- 底部有"确认，进入下一步"按钮

### 4. 审阅 Spec → 自动推进 Clarify

在编辑器中检查 spec 内容，可选修改后点击"确认"。

**验证点**：
- 系统自动调用 clarify（无需手动点击）
- 前端显示 Claude 审查过程
- 完成后编辑器中显示更新后的 spec（标注 [ASSUMPTION] 的自动补充）

### 5. 走完 Plan → Tasks

确认 clarify 后系统自动进入 plan 步骤。

**验证点**：
- plan 完成后显示结构化的技术计划（非自由文本）
- tasks 完成后显示可编辑的任务列表（`- [ ] [T001] ...` 格式）

### 6. 执行任务

点击"开始执行"。

**验证点**：
- Claude 调用 `/speckit-implement` 技能
- 前端实时显示每个任务的执行进度
- 项目目录下生成 2048.html 文件
- 浏览器打开 2048.html 可正常游戏

### 7. 重跑验证

回到 SDD 页面，点击"重新开始"。

**验证点**：前端弹窗提示选择"创建新 spec"或"更新已有 spec"。

### 8. SSE 中断恢复验证

在 specify 步骤执行中，关闭浏览器标签页。重新打开后进入同一项目的 SDD 页面。

**验证点**：系统显示已完成的结果（后端继续执行完成），或显示执行中的状态。
