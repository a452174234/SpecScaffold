# 快速上手：Playwright E2E 测试

**功能**: 002-playwright-e2e-verification
**日期**: 2026-05-03

## 前置条件

- Node.js 18+
- 项目依赖已安装（根目录、backend/、frontend/ 各运行 `npm install`）

## 安装 Playwright

```bash
# 在项目根目录安装
npm install -D @playwright/test
npx playwright install chromium
```

## 运行测试

```bash
# 运行全部 E2E 测试（headless）
npx playwright test

# 运行单个测试文件
npx playwright test frontend/e2e/home.spec.ts

# 运行并打开浏览器（调试模式）
npx playwright test --headed

# 打开 Playwright 测试报告
npx playwright show-report
```

## 配置文件位置

```
playwright.config.ts              # Playwright 主配置（项目根目录）
frontend/e2e/                     # 测试文件目录
frontend/e2e/fixtures/            # 共享测试数据
```

## 测试数据库

E2E 测试使用独立的 SQLite 数据库，通过环境变量 `TEST_DB_PATH` 控制。
每次测试运行前自动初始化表结构，运行后自动清理。

## Mock 说明

SDD 和 AI 工作区的后端 API 请求会被 Playwright 拦截并返回固定响应，
无需真实的 Claude Code 或 Spec Kit 环境。
