import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

test.describe('错误处理测试 — 验证前端错误反馈', () => {
  let projectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of projectIds) cleanupProjectData(id);
    projectIds = [];
  });

  test('访问不存在的项目 ID 显示错误提示', async ({ page }) => {
    await page.goto('/projects/nonexistent-id-12345');
    await expect(page.getByText(/加载.*失败|不存在|错误/)).toBeVisible({ timeout: 10000 });
  });

  test('SDD 页面提交空描述前端显示警告', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `SDD错误测试-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/sdd`);
    await expect(page.getByText('描述你的功能需求')).toBeVisible();

    // 不输入描述直接提交
    await page.getByRole('button', { name: '开始生成' }).click();
    // 前端应显示验证警告
    await expect(page.getByText('请输入功能描述')).toBeVisible({ timeout: 5000 });
  });

  test('AI 工作区空任务 ID 显示警告', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `AI错误测试-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/ai`);
    await expect(page.getByText('AI 工作区')).toBeVisible();

    // 不输入任务 ID 直接点击按钮
    await page.getByRole('button', { name: '生成测试' }).click();
    await expect(page.getByText('请输入任务ID')).toBeVisible({ timeout: 5000 });
  });
});
