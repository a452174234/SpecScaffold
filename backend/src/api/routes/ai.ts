import { Hono } from 'hono';
import { getDb } from '../../db';
import { AiService } from '../../services/ai-service';

export const aiRoutes = new Hono();

function getService() {
  return new AiService(getDb());
}

aiRoutes.post('/generate-tests', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const { taskId } = await c.req.json();
    if (!taskId) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '任务ID不能为空' } }, 400);
    }
    const service = getService();
    const result = await service.generateTests(projectId, taskId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

aiRoutes.post('/implement', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const { taskId } = await c.req.json();
    if (!taskId) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '任务ID不能为空' } }, 400);
    }
    const service = getService();
    const result = await service.implement(projectId, taskId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

aiRoutes.post('/run-tests', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const { taskId } = await c.req.json();
    if (!taskId) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '任务ID不能为空' } }, 400);
    }
    const service = getService();
    const result = await service.runTests(projectId, taskId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});
