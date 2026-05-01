import { Hono } from 'hono';
import { getDb } from '../../db';
import { ProjectService } from '../../services/project-service';

export const projectRoutes = new Hono();

function getService() {
  return new ProjectService(getDb());
}

projectRoutes.get('/', async (c) => {
  const service = getService();
  const projects = await service.list();
  return c.json({ success: true, data: projects });
});

projectRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const service = getService();
    const project = await service.create(body);
    return c.json({ success: true, data: project }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } }, 400);
  }
});

projectRoutes.get('/:id', async (c) => {
  const service = getService();
  const project = await service.getById(c.req.param('id'));
  if (!project) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } }, 404);
  }
  return c.json({ success: true, data: project });
});

projectRoutes.post('/import', async (c) => {
  try {
    const body = await c.req.json();
    const service = getService();
    const project = await service.import(body);
    return c.json({ success: true, data: project }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } }, 400);
  }
});

projectRoutes.delete('/:id', async (c) => {
  const service = getService();
  const archived = await service.archive(c.req.param('id'));
  if (!archived) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } }, 404);
  }
  return c.json({ success: true, data: null });
});
