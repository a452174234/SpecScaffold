import Database from 'better-sqlite3';
import { ClaudeCodeAdapter } from '../adapters/claude-code/adapter';

export class AiService {
  private adapter: ClaudeCodeAdapter;

  constructor(private db: Database.Database) {
    this.adapter = new ClaudeCodeAdapter();
  }

  async generateTests(projectId: string, taskId: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.execute(
      `为任务 ${taskId} 生成测试用例，遵循 TDD Red 阶段`,
      {
        cwd: project.path,
        appendSystemPrompt: '只生成测试用例，不要实现业务代码。测试应该先失败（Red）。',
        maxTurns: 10,
      },
    );
    return { sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  async implement(projectId: string, taskId: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.execute(
      `实现任务 ${taskId} 的业务代码，使测试通过（Green 阶段）`,
      {
        cwd: project.path,
        appendSystemPrompt: '实现最少的代码使测试通过，不要过度设计。',
        maxTurns: 15,
      },
    );
    return { sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  async runTests(projectId: string, taskId: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.execute(
      `运行任务 ${taskId} 的测试`,
      {
        cwd: project.path,
        maxTurns: 5,
      },
    );
    return { sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  private getProject(projectId: string) {
    const project = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;
    if (!project) throw new Error('项目不存在');
    return project;
  }
}
