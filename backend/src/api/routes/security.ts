import { Hono } from 'hono';
import { getDb } from '../../db';
import { SecurityService } from '../../services/security-service';

export const securityRoutes = new Hono();

function getService() {
  return new SecurityService(getDb());
}

securityRoutes.get('/policy', async (c) => {
  const projectId = c.req.param('id')!;
  const service = getService();
  const policy = service.policy.get(projectId);
  if (!policy) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '安全策略不存在' } }, 404);
  }
  return c.json({ success: true, data: policy });
});

securityRoutes.put('/policy', async (c) => {
  const projectId = c.req.param('id')!;
  const body = await c.req.json();
  const service = getService();
  const updated = service.policy.update(projectId, body);
  if (!updated) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '安全策略不存在' } }, 404);
  }
  return c.json({ success: true, data: updated });
});

securityRoutes.get('/audit-logs', async (c) => {
  const projectId = c.req.param('id')!;
  const sessionId = c.req.query('sessionId') ?? undefined;
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
  const service = getService();
  const logs = service.audit.query({ projectId, sessionId, limit });
  return c.json({ success: true, data: logs });
});
