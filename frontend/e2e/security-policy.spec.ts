import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

test.describe('US8: 安全策略查看与更新', () => {
  let projectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of projectIds) {
      cleanupProjectData(id);
    }
    projectIds = [];
  });

  test('从详情页点击安全策略卡片跳转到策略页面', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `安全策略导航-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('heading', { name: '安全策略', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/security`));
  });

  test('页面加载显示当前策略配置', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `策略查看-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/security`);
    await expect(page.getByText('安全策略配置')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('high-risk-tools')).toBeVisible();
    await expect(page.getByTestId('read-only-tools')).toBeVisible();
    await expect(page.getByTestId('dangerous-patterns')).toBeVisible();
  });

  test('修改并保存高风险工具后显示成功提示', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `策略编辑-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/security`);
    await expect(page.getByTestId('high-risk-tools')).toBeVisible({ timeout: 10000 });

    const section = page.getByTestId('high-risk-tools');
    const input = section.locator('input[placeholder="添加工具"]');
    await input.fill('NewTool');
    await input.press('Enter');

    const saveButton = page.getByTestId('save-button');
    await saveButton.click();
    await expect(page.getByText('安全策略已更新')).toBeVisible({ timeout: 5000 });
  });

  test('保存后刷新页面数据持久化', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `策略持久化-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/security`);
    await expect(page.getByTestId('high-risk-tools')).toBeVisible({ timeout: 10000 });

    const section = page.getByTestId('high-risk-tools');
    const input = section.locator('input[placeholder="添加工具"]');
    await input.fill('PersistentTool');
    await input.press('Enter');

    const saveButton = page.getByTestId('save-button');
    await saveButton.click();
    await expect(page.getByText('安全策略已更新')).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByText('PersistentTool')).toBeVisible({ timeout: 10000 });
  });
});
