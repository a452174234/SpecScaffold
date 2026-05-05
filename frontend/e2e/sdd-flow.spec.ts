import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';
import { mockSddApi, mockSddSSE, mockSddExtraEndpoints } from './fixtures/api-mocks';

test.describe('US4: SDD 规格驱动开发流程', () => {
  let projectId: string;

  test.beforeEach(async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-SDD测试');
    projectId = project.id;
    await mockSddApi(page);
    await mockSddSSE(page, 'specify', {
      specFilePath: 'specs/test-feature/spec.md',
      content: '# Feature Specification',
      tokenUsage: { input: 1000, output: 2000 },
    });
    await mockSddExtraEndpoints(page);
    await page.goto(`/projects/${projectId}/sdd`);
  });

  test.afterEach(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('从详情页点击 SDD 卡片跳转', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, 'E2E-SDD导航');
    await page.goto(`/projects/${project.id}`);
    await page.getByText('SDD 规格驱动开发').click();
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/sdd`));
    cleanupProjectData(project.id);
  });

  test('第一步功能描述输入和提交后进入第二步', async ({ page }) => {
    await expect(page.getByText('描述你的功能需求')).toBeVisible();
    await page.getByPlaceholder('请用自然语言描述你想要的功能').fill('测试功能描述');
    await page.getByRole('button', { name: '开始生成' }).click();
    await expect(page.getByText('澄清规格歧义')).toBeVisible({ timeout: 5000 });
  });

  test('四步骤引导 UI 正确渲染', async ({ page }) => {
    await expect(page.getByText('功能描述')).toBeVisible();
    await expect(page.getByText('澄清歧义')).toBeVisible();
    await expect(page.getByText('生成计划')).toBeVisible();
    await expect(page.getByText('任务列表')).toBeVisible();
  });

  test('API 端点返回数据格式正确', async ({ request }) => {
    const specifyRes = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/specify`, {
      data: { description: '测试功能' },
    });
    const body = await specifyRes.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('specId');
  });

  test('SDD status 端点可用', async ({ request }) => {
    const res = await request.get(`http://localhost:3000/api/projects/${projectId}/sdd/status`);
    const body = await res.json();
    expect(body.success).toBeTruthy();
    expect(body.data).toHaveProperty('spec');
    expect(body.data).toHaveProperty('plan');
  });

  test('SDD content save 端点可用', async ({ request }) => {
    const res = await request.post(`http://localhost:3000/api/projects/${projectId}/sdd/content/save`, {
      data: { step: 'specify', content: '# test' },
    });
    const body = await res.json();
    expect(body.success).toBeTruthy();
  });
});
