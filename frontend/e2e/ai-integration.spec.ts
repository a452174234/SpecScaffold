import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

const API_BASE = 'http://localhost:3000/api';

test.describe('AI API 集成测试 — 验证前后端路由一致性', () => {
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    const project = await createProjectViaAPI(request, `AI集成-${Date.now()}`);
    projectId = project.id;
  });

  test.afterAll(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('POST /api/projects/:id/ai/generate-tests 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/ai/generate-tests`, {
      data: { taskId: 'T001' },
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });

  test('POST /api/projects/:id/ai/generate-tests 空 taskId 返回 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/ai/generate-tests`, {
      data: { taskId: '' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('message');
  });

  test('POST /api/projects/:id/ai/implement 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/ai/implement`, {
      data: { taskId: 'T001' },
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });

  test('POST /api/projects/:id/ai/run-tests 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/ai/run-tests`, {
      data: { taskId: 'T001' },
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });
});
