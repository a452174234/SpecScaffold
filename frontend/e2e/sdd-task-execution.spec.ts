import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import { mockSddSSE, mockSddExtraEndpoints } from './fixtures/api-mocks';

test.describe('US3: 可调整的任务列表与一键执行', () => {
  let projectId: string;

  test.beforeEach(async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-SDD-Task测试');
    projectId = project.id;
    await mockSddExtraEndpoints(page);
    await page.goto(`/projects/${projectId}/sdd`);
  });

  test.afterEach(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  async function goToTasksStep(page: any) {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification',
      tokenUsage: { input: 1000, output: 2000 },
    });
    await mockSddSSE(page, 'clarify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Clarified Spec',
      tokenUsage: { input: 500, output: 1000 },
    });
    await mockSddSSE(page, 'plan', {
      planFilePath: 'specs/test-feature/plan.md',
      content: '# Implementation Plan',
      tokenUsage: { input: 2000, output: 3000 },
    });
    await mockSddSSE(page, 'tasks', {
      tasksFilePath: 'specs/test-feature/tasks.md',
      taskCount: 3,
      content:
        '## Phase 1\n\n- [ ] T001 安装依赖\n- [ ] T002 扩展类型\n- [ ] T003 添加 SSE 函数',
      tokenUsage: { input: 1500, output: 2500 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();
    await expect(page.getByText('任务列表')).toBeVisible({ timeout: 15000 });
  }

  test('T032: tasks 完成后显示任务卡片列表', async ({ page }) => {
    await goToTasksStep(page);
    const cards = page.locator('[data-testid="task-card"]');
    await expect(cards).toHaveCount(3, { timeout: 5000 });
  });

  test('T033: 编辑任务描述后列表更新', async ({ page }) => {
    await goToTasksStep(page);
    const firstCard = page.locator('[data-testid="task-card"]').first();
    await firstCard.getByRole('textbox').fill('T001 修改后的描述');
    await expect(firstCard).toContainText('修改后的描述');
  });

  test('T034: 删除任务后列表减少', async ({ page }) => {
    await goToTasksStep(page);
    const cards = page.locator('[data-testid="task-card"]');
    await expect(cards).toHaveCount(3, { timeout: 5000 });
    await cards.first().getByRole('button', { name: '删除' }).click();
    await expect(cards).toHaveCount(2);
  });

  test('T035: 点击开始执行调用 implement 端点', async ({ page }) => {
    await goToTasksStep(page);

    let implementCalled = false;
    await page.route('**/api/projects/*/sdd/implement', async (route) => {
      implementCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { completedTasks: 3, failedTasks: 0, changedFiles: [] },
        }),
      });
    });

    await page.getByRole('button', { name: '开始执行' }).click();
    await expect(page.getByText('执行完成')).toBeVisible({ timeout: 5000 });
    expect(implementCalled).toBeTruthy();
  });

  test('T036: 执行过程中显示实时进度', async ({ page }) => {
    await goToTasksStep(page);

    await mockSddSSE(page, 'implement', {
      completedTasks: 3,
      failedTasks: 0,
      changedFiles: ['src/index.ts'],
      tokenUsage: { input: 5000, output: 8000 },
    });

    await page.getByRole('button', { name: '开始执行' }).click();
    await expect(page.getByTestId('sdd-log-area')).toBeVisible({ timeout: 5000 });
  });
});
