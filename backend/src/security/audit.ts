import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

export interface AuditLogEntry {
  id: string;
  project_id: string;
  session_id: string;
  tool_name: string;
  operation: string;
  target: string;
  risk_level: string;
  is_in_project_scope: number;
  audit_result: string;
  operation_description: string;
  user_feedback: string | null;
  timestamp: string;
}

export class AuditService {
  constructor(private db: Database.Database) {}

  log(entry: {
    projectId: string;
    sessionId: string;
    toolName: string;
    operation: string;
    target: string;
    riskLevel: string;
    isInProjectScope: boolean;
    auditResult: string;
    operationDescription: string;
  }): string {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO audit_logs (id, project_id, session_id, tool_name, operation, target, risk_level, is_in_project_scope, audit_result, operation_description, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      entry.projectId,
      entry.sessionId,
      entry.toolName,
      entry.operation,
      entry.target,
      entry.riskLevel,
      entry.isInProjectScope ? 1 : 0,
      entry.auditResult,
      entry.operationDescription,
    );
    return id;
  }

  query(filter: { projectId: string; sessionId?: string; limit?: number }): AuditLogEntry[] {
    let sql = 'SELECT * FROM audit_logs WHERE project_id = ?';
    const params: any[] = [filter.projectId];

    if (filter.sessionId) {
      sql += ' AND session_id = ?';
      params.push(filter.sessionId);
    }

    sql += ' ORDER BY timestamp DESC';

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    return this.db.prepare(sql).all(...params) as AuditLogEntry[];
  }

  updateResult(id: string, result: string, feedback?: string) {
    this.db.prepare(`
      UPDATE audit_logs SET audit_result = ?, user_feedback = ? WHERE id = ?
    `).run(result, feedback || null, id);
  }
}
