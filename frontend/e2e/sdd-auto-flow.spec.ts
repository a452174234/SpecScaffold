import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import { mockSddSSE, mockSddExtraEndpoints } from './fixtures/api-mocks';

test.describe('US1: SDD 步骤自动推进', () => {
  let projectId: string;

  test.beforeEach(async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-SDD-Auto测试');
    projectId = project.id;
    await mockSddExtraEndpoints(page);
    await page.goto(`/projects/${projectId}/sdd`);
  });

  test.afterEach(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('T010: specify 完成后自动进入 clarify 步骤', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });

    await expect(page.getByText('描述你的功能需求')).toBeVisible();
    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.getByText('澄清规格歧义')).toBeVisible({ timeout: 5000 });
  });

  test('T011: clarify 完成后自动进入 plan 步骤', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });
    await mockSddSSE(page, 'clarify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 澄清后的规格',
      tokenUsage: { input: 500, output: 1000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.getByText('生成计划')).toBeVisible({ timeout: 10000 });
  });

  test('T012: plan 完成后自动进入 tasks 步骤', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });
    await mockSddSSE(page, 'clarify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 澄清后的规格',
      tokenUsage: { input: 500, output: 1000 },
    });
    await mockSddSSE(page, 'plan', {
      planFilePath: 'specs/test-feature/plan.md',
      content: '# Implementation Plan: 测试计划',
      tokenUsage: { input: 2000, output: 3000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.getByText('任务列表')).toBeVisible({ timeout: 15000 });
  });

  test('T013: 执行过程中实时显示 Claude 日志', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.getByTestId('sdd-log-area')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/正在执行 specify/)).toBeVisible({ timeout: 5000 });
  });

  test('T014: SSE 断开后通过 /sdd/status 恢复', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.getByText('澄清规格歧义')).toBeVisible({ timeout: 5000 });

    // Reload page to simulate SSE disconnection
    await page.reload();

    // Should recover state via /sdd/status
    await expect(page.getByText('澄清规格歧义')).toBeVisible({ timeout: 5000 });
  });

  test('T015: API 端点返回 content 字段', async ({ request }) => {
    const specifyRes = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/specify`, {
      data: { description: '测试功能' },
    });
    const specifyBody = await specifyRes.json();
    expect(specifyBody.success).toBeTruthy();
    expect(specifyBody.data.content).toBeDefined();

    const clarifyRes = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/clarify`, {
      data: { clarification: '补充说明' },
    });
    const clarifyBody = await clarifyRes.json();
    expect(clarifyBody.success).toBeTruthy();
    expect(clarifyBody.data.content).toBeDefined();

    const planRes = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/plan`, {
      data: {},
    });
    const planBody = await planRes.json();
    expect(planBody.success).toBeTruthy();
    expect(planBody.data.content).toBeDefined();

    const tasksRes = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/tasks`, {
      data: {},
    });
    const tasksBody = await tasksRes.json();
    expect(tasksBody.success).toBeTruthy();
    expect(tasksBody.data.content).toBeDefined();
  });
});
