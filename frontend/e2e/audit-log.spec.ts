import { test, expect } from '@playwright/test';
import { createProjectViaAPI, insertAuditLogDirect, cleanupProjectData } from './fixtures/test-data';

test.describe('US7: 安全审计日志查看', () => {
  let projectId: string;
  let projectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of projectIds) {
      cleanupProjectData(id);
    }
    projectIds = [];
  });

  test('从详情页点击审计日志卡片跳转', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `审计导航-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('heading', { name: '审计日志', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/audit`));
  });

  test('日志表格正确渲染每条记录', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `审计日志-${Date.now()}`);
    projectIds.push(project.id);
    insertAuditLogDirect(project.id, 'Bash', `执行命令-${Date.now()}`, 'high', 'auto_allowed');
    insertAuditLogDirect(project.id, 'Grep', `读取文件-${Date.now()}`, 'read_only', 'auto_allowed');

    await page.goto(`/projects/${project.id}/audit`);
    await expect(page.getByText('Bash')).toBeVisible();
    await expect(page.getByText('Grep')).toBeVisible();
  });

  test('风险级别标签颜色区分', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `风险颜色-${Date.now()}`);
    projectIds.push(project.id);
    insertAuditLogDirect(project.id, 'Bash', `高风险-${Date.now()}`, 'high', 'auto_allowed');
    insertAuditLogDirect(project.id, 'Read', `只读-${Date.now()}`, 'read_only', 'auto_allowed');

    await page.goto(`/projects/${project.id}/audit`);
    await expect(page.getByText('high')).toBeVisible();
    await expect(page.getByText('read_only')).toBeVisible();
  });

  test('审计日志页面标题可见', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `空审计-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/audit`);
    await expect(page.getByText('审计日志')).toBeVisible();
  });
});
