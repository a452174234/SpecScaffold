import { test, expect } from '@playwright/test';
import { createProjectViaAPI, cleanupProjectData } from './fixtures/test-data';

const API_BASE = 'http://localhost:3000/api';

test.describe('SDD API 集成测试 — 验证前后端路由一致性', () => {
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    const project = await createProjectViaAPI(request, `SDD集成-${Date.now()}`);
    projectId = project.id;
  });

  test.afterAll(async () => {
    if (projectId) cleanupProjectData(projectId);
  });

  test('POST /api/projects/:id/sdd/specify 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/specify`, {
      data: { description: '测试功能描述' },
    });
    // 不验证成功（依赖外部 AI），只验证路由存在（非 404）
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
    if (body.success) {
      expect(body.data).toBeDefined();
    } else {
      expect(body.error).toBeDefined();
    }
  });

  test('POST /api/projects/:id/sdd/specify 空描述返回 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/specify`, {
      data: { description: '' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('message');
  });

  test('POST /api/projects/:id/sdd/clarify 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/clarify`, {
      data: { clarification: '补充说明' },
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });

  test('POST /api/projects/:id/sdd/plan 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/plan`, {
      data: {},
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });

  test('POST /api/projects/:id/sdd/tasks 路由可达', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/tasks`, {
      data: {},
    });
    expect(res.status()).not.toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('success');
  });
});
