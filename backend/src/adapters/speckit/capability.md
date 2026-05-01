# Spec Kit 能力边界文档

**版本**: v1.0.0
**日期**: 2026-05-01

## 概述

Spec Kit 是 SDD（规格驱动开发）流程引擎，通过 Claude Code Skills 系统提供能力。本平台通过 `SpeckitAdapter` 间接调用 Spec Kit。

## 支持的能力

| 能力 | 方法 | 说明 |
|------|------|------|
| 从自然语言生成 Spec | `specify()` | 输入功能描述，生成 spec.md |
| 澄清规格歧义 | `clarify()` | 输入澄清内容，更新 spec.md |
| 生成实施计划 | `plan()` | 生成 plan.md、research.md、data-model.md、contracts/ |
| 生成任务列表 | `tasks()` | 生成 tasks.md，包含可并行标记 |
| 自动执行实现 | `implement()` | 执行任务列表中的实现 |

## 限制

- **必须通过 Claude Code**: 无法直接 API 调用，依赖 Claude Code CLI 的 Skills 发现机制
- **部分执行**: 不支持只执行某些任务，需通过 prompt 控制范围
- **输出格式**: 文件输出到项目的 `specs/` 目录，格式由 Skill 定义
- **异步性**: 生成过程可能耗时较长，需要通过 WebSocket 推送进度

## 调用链路

```text
前端 → API → SddService → SpeckitAdapter → Claude Code SDK → Claude Code CLI → Skills
```
