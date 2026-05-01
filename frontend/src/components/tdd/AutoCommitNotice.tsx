import { Alert } from 'antd';

export function AutoCommitNotice({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Alert
      message="自动提交"
      description="TDD 测试通过后，系统将自动执行 git add + commit 提交变更。"
      type="info"
      showIcon
      style={{ marginBottom: 8 }}
    />
  );
}
