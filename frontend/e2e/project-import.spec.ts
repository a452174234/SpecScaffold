import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('US3: 导入现有项目', () => {
  let createdProjectIds: string[] = [];
  let tempDirs: string[] = [];

  test.afterEach(async () => {
    for (const id of createdProjectIds) {
      cleanupProjectData(id);
    }
    createdProjectIds = [];
    for (const dir of tempDirs) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
    tempDirs = [];
  });

  test('导入页面加载', async ({ page }) => {
    await page.goto('/projects/import');
    await expect(page.getByText('导入现有项目')).toBeVisible();
    await expect(page.getByLabel('项目名称')).toBeVisible();
    await expect(page.getByLabel('项目路径')).toBeVisible();
  });

  test('导入 TypeScript 项目后展示语言/框架标签', async ({ page }) => {
    const tempDir = path.join(os.tmpdir(), `e2e-import-ts-${Date.now()}`);
    tempDirs.push(tempDir);
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), '{}');
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: { react: '^18.0.0' },
    }));

    await page.goto('/projects/import');
    const uniqueName = `E2E导入TS-${Date.now()}`;
    await page.getByLabel('项目名称').fill(uniqueName);
    await page.getByLabel('项目路径').fill(tempDir);

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/projects/import') && resp.status() === 201,
    );
    await page.getByRole('button', { name: '导入项目' }).click();
    const res = await responsePromise;
    const body = await res.json();

    if (body.success && body.data?.id) {
      createdProjectIds.push(body.data.id);
      await expect(page.getByText('TypeScript')).toBeVisible({ timeout: 5000 });
    }
  });

  test('输入不存在路径显示错误提示', async ({ page }) => {
    await page.goto('/projects/import');
    await page.getByLabel('项目名称').fill('不存在项目');
    await page.getByLabel('项目路径').fill('/nonexistent/path/that/does/not/exist');
    await page.getByRole('button', { name: '导入项目' }).click();

    await expect(page.getByText(/(不存在|失败|错误)/)).toBeVisible({ timeout: 5000 });
  });

  test('从首页导航到导入页面', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /导入/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/import/);
  });
});
