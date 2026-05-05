import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import { mockSddSSE, mockSddExtraEndpoints } from './fixtures/api-mocks';

test.describe('US2: 每步产出可审阅可编辑', () => {
  let projectId: string;

  test.beforeEach(async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-SDD-Edit测试');
    projectId = project.id;
    await mockSddExtraEndpoints(page);
    await page.goto(`/projects/${projectId}/sdd`);
  });

  test.afterEach(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('T025: specify 完成后出现 Markdown 编辑器', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格\n\n## 概述\n这是一个测试。',
      tokenUsage: { input: 1000, output: 2000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.locator('.w-md-editor')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.w-md-editor')).toContainText('测试规格');
  });

  test('T026: 修改编辑器内容后点击确认，调用 save 端点', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 原始内容',
      tokenUsage: { input: 1000, output: 2000 },
    });

    let savedBody: any = null;
    await page.route('**/api/projects/*/sdd/content/save', async (route) => {
      const request = route.request();
      savedBody = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { filePath: 'specs/test-feature/spec.md' } }),
      });
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.locator('.w-md-editor')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '确认，进入下一步' }).click();

    await expect(page.getByText('澄清规格歧义')).toBeVisible({ timeout: 5000 });
    expect(savedBody).toBeTruthy();
    expect(savedBody.step).toBe('specify');
    expect(savedBody.content).toBeTruthy();
  });

  test('T027: 修改前序步骤后显示重新执行提示', async ({ page }) => {
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification: 测试规格',
      tokenUsage: { input: 1000, output: 2000 },
    });

    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('2048 小游戏');
    await page.getByRole('button', { name: '开始生成' }).click();

    await expect(page.locator('.w-md-editor')).toBeVisible({ timeout: 10000 });

    // Click on the step 1 in Steps component to go back
    await page.getByText('功能描述').click();

    await expect(page.getByText(/已修改上游内容|建议重新执行/)).toBeVisible({ timeout: 5000 });
  });
});
