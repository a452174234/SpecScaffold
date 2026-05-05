import { test, expect } from '@playwright/test';
import { createProjectViaAPI, insertTaskDirect, cleanupProjectData } from './fixtures/test-data';

test.describe('US6: 任务面板状态流转', () => {
  let projectIds: string[] = [];

  test.afterEach(async () => {
    for (const id of projectIds) {
      cleanupProjectData(id);
    }
    projectIds = [];
  });

  test('任务面板表格渲染', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `任务面板-${Date.now()}`);
    projectIds.push(project.id);
    insertTaskDirect(project.id, 'T001', '测试任务一', 'P1');

    await page.goto(`/projects/${project.id}/tasks`);
    await expect(page.getByText('测试任务一')).toBeVisible();
    await expect(page.getByText('T001')).toBeVisible();
  });

  test('pending 状态任务执行合法状态变更后标签更新', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `状态变更-${Date.now()}`);
    projectIds.push(project.id);
    insertTaskDirect(project.id, 'T002', '状态变更任务', 'P2', 'pending');

    await page.goto(`/projects/${project.id}/tasks`);
    await expect(page.getByText('状态变更任务')).toBeVisible();
    await page.getByRole('button', { name: '开始测试' }).click();
    await expect(page.getByText('状态已更新')).toBeVisible({ timeout: 5000 });
  });

  test('任务面板页面标题可见', async ({ page, request }) => {
    const project = await createProjectViaAPI(request, `空任务-${Date.now()}`);
    projectIds.push(project.id);

    await page.goto(`/projects/${project.id}/tasks`);
    await expect(page.getByText('任务面板')).toBeVisible();
  });
});
