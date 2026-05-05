import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

test.describe('US1: 首页项目列表与导航', () => {
  let createdProjectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of createdProjectIds) {
      cleanupProjectData(id);
    }
    createdProjectIds = [];
  });

  test('页面标题和导航元素可见', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible();
    await expect(page.getByRole('button', { name: /新建/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /导入/ })).toBeVisible();
  });

  test('首页显示新建和导入按钮入口', async ({ page }) => {
    await page.goto('/');
    const newBtn = page.locator('button').filter({ hasText: /新建/ });
    const importBtn = page.locator('button').filter({ hasText: /导入/ });
    await expect(newBtn.first()).toBeVisible();
    await expect(importBtn.first()).toBeVisible();
  });

  test('点击新建项目跳转到创建页面', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /新建/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);
  });

  test('点击导入项目跳转到导入页面', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /导入/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/import/);
  });

  test('已有项目时显示项目卡片', async ({ page, request }) => {
    const uniqueName = `首页测试-${Date.now()}`;
    const project = await createProjectViaAPI(request, uniqueName);
    createdProjectIds.push(project.id);

    await page.goto('/');
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
  });
});
