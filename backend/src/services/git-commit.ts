import { execSync } from 'child_process';

export class GitCommitService {
  commitAfterTddPass(projectPath: string, taskId: string, taskTitle: string): boolean {
    try {
      this.stageAll(projectPath);
      this.commit(projectPath, taskId, taskTitle);
      return true;
    } catch {
      return false;
    }
  }

  private stageAll(projectPath: string) {
    execSync('git add -A', { cwd: projectPath, stdio: 'pipe' });
  }

  private commit(projectPath: string, taskId: string, taskTitle: string) {
    const message = `${taskId}: ${taskTitle}\n\nTDD 测试通过后自动提交`;
    execSync(`git commit -m ${JSON.stringify(message)}`, {
      cwd: projectPath,
      stdio: 'pipe',
    });
  }
}
