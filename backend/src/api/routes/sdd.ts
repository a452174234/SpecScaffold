import { Hono } from 'hono';
import { getDb } from '../../db';
import { SddService } from '../../services/sdd-service';

export const sddRoutes = new Hono();

function getService() {
  return new SddService(getDb());
}

sddRoutes.post('/specify', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { description } = await c.req.json();
    if (!description) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '功能描述不能为空' } }, 400);
    }
    const service = getService();
    const result = await service.specify(projectId, description);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.post('/clarify', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { clarification } = await c.req.json();
    const service = getService();
    const result = await service.clarify(projectId, clarification);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.post('/plan', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { guidance } = await c.req.json().catch(() => ({ guidance: undefined }));
    const service = getService();
    const result = await service.plan(projectId, guidance);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.post('/tasks', async (c) => {
  try {
    const projectId = c.req.param('id');
    const { constraints } = await c.req.json().catch(() => ({ constraints: undefined }));
    const service = getService();
    const result = await service.tasks(projectId, constraints);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});
