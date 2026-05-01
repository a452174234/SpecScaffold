import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { projectRoutes } from '../../../src/api/routes/projects';
import { getTestDb, cleanTestDb } from '../../setup';

describe('POST /api/projects', () => {
  let app: Hono;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    app = new Hono();
    app.route('/api/projects', projectRoutes);
  });

  it('应返回 201 创建新项目', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '集成测试项目',
        path: `/tmp/integration-test-${Date.now()}`,
        type: 'created',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('集成测试项目');
    expect(body.data.type).toBe('created');
  });

  it('应返回 400 当参数校验失败时', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', path: '/tmp/test', type: 'created' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('应返回项目列表', async () => {
    const res = await app.request('/api/projects');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('应返回单个项目详情', async () => {
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '详情测试',
        path: `/tmp/detail-test-${Date.now()}`,
        type: 'created',
      }),
    });
    const { data } = await createRes.json();

    const res = await app.request(`/api/projects/${data.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('详情测试');
  });

  it('应返回 404 查询不存在的项目', async () => {
    const res = await app.request('/api/projects/non-existent-id');

    expect(res.status).toBe(404);
  });
});
