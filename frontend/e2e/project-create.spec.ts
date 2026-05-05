import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

test.describe('US2: 创建脚手架项目', () => {
  let createdProjectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of createdProjectIds) {
      cleanupProjectData(id);
    }
    createdProjectIds = [];
  });

  test('创建页面表单加载', async ({ page }) => {
    await page.goto('/projects/new');
    await expect(page.getByText('新建项目')).toBeVisible();
    await expect(page.getByLabel('项目名称')).toBeVisible();
    await expect(page.getByLabel('项目路径')).toBeVisible();
    await expect(page.getByRole('button', { name: '创建项目' })).toBeVisible();
  });

  test('填写名称和路径后提交成功跳转到详情页', async ({ page }) => {
    await page.goto('/projects/new');

    const uniqueName = `E2E创建测试-${Date.now()}`;
    const uniquePath = `${process.env.TEMP || '/tmp'}/e2e-create-${Date.now()}`;

    await page.getByLabel('项目名称').fill(uniqueName);
    await page.getByLabel('项目路径').fill(uniquePath);
    await page.getByRole('button', { name: '创建项目' }).click();

    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);

    const url = page.url();
    const match = url.match(/\/projects\/([a-f0-9-]+)/);
    if (match) createdProjectIds.push(match[1]);

    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('详情页显示导航卡片', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E导航测试');
    createdProjectIds.push(project.id);

    await page.goto(`/projects/${project.id}`);
    await expect(page.getByText('SDD 规格驱动开发')).toBeVisible();
    await expect(page.getByText('AI 工作区')).toBeVisible();
    await expect(page.getByText('任务面板')).toBeVisible();
    await expect(page.getByText('审计日志')).toBeVisible();
    await expect(page.getByRole('heading', { name: '安全策略', exact: true })).toBeVisible();
  });

  test('空字段提交显示校验错误', async ({ page }) => {
    await page.goto('/projects/new');
    await page.getByRole('button', { name: '创建项目' }).click();
    await expect(page.getByText('请输入项目名称')).toBeVisible();
  });

  test('从首页导航到创建页面', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /新建/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);
  });
});
