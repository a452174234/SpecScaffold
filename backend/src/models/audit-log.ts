import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  sessionId: z.string().nullable(),
  toolName: z.string(),
  operation: z.string(),
  target: z.string().nullable(),
  riskLevel: z.enum(['read_only', 'low', 'high', 'blocked']),
  isInProjectScope: z.boolean(),
  auditResult: z.enum(['auto_allowed', 'user_approved', 'user_rejected', 'blocked']),
  operationDescription: z.string().nullable(),
  userFeedback: z.string().nullable(),
  timestamp: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
