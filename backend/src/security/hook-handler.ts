import { Hono } from 'hono';
import { getDb } from '../db';
import { SecurityService } from '../services/security-service';
import type { OperationContext } from '../security/fence';

const hookApp = new Hono();

hookApp.post('/evaluate', async (c) => {
  const body = await c.req.json();
  const service = new SecurityService(getDb());

  const ctx: OperationContext = {
    projectId: body.projectId,
    projectPath: body.projectPath,
    toolName: body.toolName,
    operation: body.operation || `${body.toolName} 操作`,
    target: body.target,
    sessionId: body.sessionId,
  };

  const decision = await service.fence.handleOperation(ctx);
  return c.json(decision);
});

hookApp.post('/:auditId/respond', async (c) => {
  const auditId = c.req.param('auditId');
  const body = await c.req.json();
  const service = new SecurityService(getDb());

  service.fence.submitAuditResult(auditId, body.approved, body.feedback);
  return c.json({ success: true });
});

export { hookApp };
