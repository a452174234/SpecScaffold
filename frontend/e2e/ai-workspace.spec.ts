import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import { mockAiApi } from './fixtures/api-mocks';

test.describe('US5: AI 集成工作区操作', () => {
  let projectId: string;

  test.beforeEach(async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-AI测试');
    projectId = project.id;
    await mockAiApi(page);
    await page.goto(`/projects/${projectId}/ai`);
  });

  test.afterEach(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('从详情页点击 AI 工作区卡片跳转', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-AI导航');
    await page.goto(`/projects/${project.id}`);
    await page.getByText('AI 工作区').click();
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/ai`));
    cleanupProjectData(project.id);
  });

  test('页面显示任务 ID 输入框和三个操作按钮', async ({ page }) => {
    await expect(page.getByPlaceholder('例如：T001')).toBeVisible();
    await expect(page.getByRole('button', { name: /生成测试/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /实现代码/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '运行测试' })).toBeVisible();
  });

  test('输入任务 ID 点击生成测试后输出区域显示状态', async ({ page }) => {
    await page.getByPlaceholder('例如：T001').fill('T001');
    await page.getByRole('button', { name: /生成测试/ }).click();
    await expect(page.getByText(/\[测试生成\]/)).toBeVisible({ timeout: 5000 });
  });

  test('点击实现代码后输出区域显示状态', async ({ page }) => {
    await page.getByPlaceholder('例如：T001').fill('T001');
    await page.getByRole('button', { name: /实现代码/ }).click();
    await expect(page.getByText(/\[代码实现\]/)).toBeVisible({ timeout: 5000 });
  });

  test('点击运行测试后输出区域显示状态', async ({ page }) => {
    await page.getByPlaceholder('例如：T001').fill('T001');
    await page.getByRole('button', { name: '运行测试' }).click();
    await expect(page.getByText(/\[运行测试\]/)).toBeVisible({ timeout: 5000 });
  });

  test('未输入任务 ID 时点击按钮显示验证提示', async ({ page }) => {
    await page.getByRole('button', { name: /生成测试/ }).click();
    await expect(page.getByText('请输入任务ID')).toBeVisible({ timeout: 5000 });
  });
});
