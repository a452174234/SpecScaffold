import { describe, it, expect } from 'vitest';
import { WorkflowStateMachine, VALID_TRANSITIONS } from '../../../src/core/workflow';

describe('WorkflowStateMachine', () => {
  it('应定义完整的状态流转路径', () => {
    expect(VALID_TRANSITIONS['pending']).toContain('testing');
    expect(VALID_TRANSITIONS['testing']).toContain('test_approved');
    expect(VALID_TRANSITIONS['test_approved']).toContain('developing');
    expect(VALID_TRANSITIONS['developing']).toContain('testing_pass');
    expect(VALID_TRANSITIONS['testing_pass']).toContain('completed');
  });

  it('应验证合法的转换', () => {
    expect(WorkflowStateMachine.canTransition('pending', 'testing')).toBe(true);
    expect(WorkflowStateMachine.canTransition('testing', 'test_approved')).toBe(true);
  });

  it('应拒绝非法的转换', () => {
    expect(WorkflowStateMachine.canTransition('pending', 'developing')).toBe(false);
    expect(WorkflowStateMachine.canTransition('pending', 'completed')).toBe(false);
  });

  it('应允许 testing 状态回到 testing（测试失败重试）', () => {
    expect(WorkflowStateMachine.canTransition('testing', 'testing')).toBe(true);
  });
});
