type TaskStatus = 'pending' | 'testing' | 'test_approved' | 'developing' | 'testing_pass' | 'completed';

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['testing'],
  testing: ['test_approved', 'testing'],
  test_approved: ['developing'],
  developing: ['testing_pass'],
  testing_pass: ['completed'],
  completed: [],
};

export class WorkflowStateMachine {
  static canTransition(from: TaskStatus, to: TaskStatus): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  static validateTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`不允许的状态转换: ${from} → ${to}`);
    }
  }
}
