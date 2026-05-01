import { Hono } from 'hono';
import { getDb } from '../../db';
import { TddService } from '../../services/tdd-service';

export const taskRoutes = new Hono();

function getService() {
  return new TddService(getDb());
}

taskRoutes.get('/', async (c) => {
  const projectId = c.req.param('id');
  const service = getService();
  const tasks = service.getTasksByProject(projectId);
  return c.json({ success: true, data: tasks });
});

taskRoutes.patch('/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const { status } = await c.req.json();
    if (!status) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '状态不能为空' } }, 400);
    }
    const service = getService();
    const updated = service.transitionStatus(taskId, status);
    return c.json({ success: true, data: { updated } });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});
