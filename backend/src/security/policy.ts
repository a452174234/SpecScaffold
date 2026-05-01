import Database from 'better-sqlite3';

export interface SecurityPolicy {
  id: string;
  projectId: string;
  projectPath: string;
  highRiskTools: string[];
  highRiskPatterns: string[];
  readOnlyExternalTools: string[];
}

export class PolicyManager {
  constructor(private db: Database.Database) {}

  get(projectId: string): SecurityPolicy | null {
    const row = this.db
      .prepare('SELECT * FROM security_policies WHERE project_id = ?')
      .get(projectId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  update(
    projectId: string,
    updates: {
      highRiskTools?: string[];
      highRiskPatterns?: string[];
      readOnlyExternalTools?: string[];
    },
  ): SecurityPolicy | null {
    const current = this.get(projectId);
    if (!current) return null;

    const highRiskTools = updates.highRiskTools ?? current.highRiskTools;
    const highRiskPatterns = updates.highRiskPatterns ?? current.highRiskPatterns;
    const readOnlyExternalTools = updates.readOnlyExternalTools ?? current.readOnlyExternalTools;

    this.db.prepare(`
      UPDATE security_policies
      SET high_risk_tools = ?, high_risk_patterns = ?, read_only_external_tools = ?
      WHERE project_id = ?
    `).run(
      JSON.stringify(highRiskTools),
      JSON.stringify(highRiskPatterns),
      JSON.stringify(readOnlyExternalTools),
      projectId,
    );

    return this.get(projectId);
  }

  private mapRow(row: any): SecurityPolicy {
    return {
      id: row.id,
      projectId: row.project_id,
      projectPath: row.project_path,
      highRiskTools: JSON.parse(row.high_risk_tools),
      highRiskPatterns: JSON.parse(row.high_risk_patterns),
      readOnlyExternalTools: JSON.parse(row.read_only_external_tools),
    };
  }
}
