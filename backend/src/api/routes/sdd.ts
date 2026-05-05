import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getDb } from '../../db';
import { SddService } from '../../services/sdd-service';
import type { StreamMessage } from '../../adapters/claude-code/types';

export const sddRoutes = new Hono();

function getService() {
  return new SddService(getDb());
}

sddRoutes.post('/specify', async (c) => {
  try {
    const projectId = c.req.param('id')!;
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
    const projectId = c.req.param('id')!;
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
    const projectId = c.req.param('id')!;
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
    const projectId = c.req.param('id')!;
    const { constraints } = await c.req.json().catch(() => ({ constraints: undefined }));
    const service = getService();
    const result = await service.tasks(projectId, constraints);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.post('/:step/stream', async (c) => {
  const projectId = c.req.param('id')!;
  const step = c.req.param('step')!;
  const body = await c.req.json().catch(() => ({}));

  const validSteps = ['specify', 'clarify', 'plan', 'tasks', 'implement'];
  if (!validSteps.includes(step)) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: `无效的步骤: ${step}` } }, 400);
  }

  if (step === 'specify' && !body.description) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '功能描述不能为空' } }, 400);
  }

  return streamSSE(c, async (stream) => {
    const service = getService();

    await stream.writeSSE({
      data: JSON.stringify({
        type: 'init',
        content: { session_id: '' },
        timestamp: Date.now(),
      }),
    });

    const onMessage = async (msg: StreamMessage) => {
      await stream.writeSSE({
        data: JSON.stringify({
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp,
        }),
      });
    };

    try {
      const result = await service.streamStep(projectId, step, body, onMessage);

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'result',
          content: result,
          timestamp: Date.now(),
        }),
      });

      await stream.writeSSE({ data: '[DONE]' });
    } catch (err: any) {
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'result',
          content: { error: err.message },
          timestamp: Date.now(),
        }),
      });

      await stream.writeSSE({ data: '[DONE]' });
    }
  });
});

sddRoutes.post('/content/save', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const { step, content } = await c.req.json();
    if (!step || !content) {
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'step 和 content 不能为空' } }, 400);
    }
    const service = getService();
    const filePath = await service.saveContent(projectId, step, content);
    return c.json({ success: true, data: { filePath } });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.get('/status', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const service = getService();
    const status = service.getStatus(projectId);
    return c.json({ success: true, data: status });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.get('/scan-existing', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const service = getService();
    const result = service.scanExistingSpecs(projectId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});

sddRoutes.post('/implement', async (c) => {
  try {
    const projectId = c.req.param('id')!;
    const service = getService();
    const result = await service.implement(projectId);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'ERROR', message: err.message } }, 400);
  }
});
