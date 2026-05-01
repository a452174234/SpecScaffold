import { Tag } from 'antd';

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待处理' },
  testing: { color: 'processing', label: '测试中' },
  test_approved: { color: 'blue', label: '测试已审批' },
  developing: { color: 'orange', label: '开发中' },
  testing_pass: { color: 'cyan', label: '测试通过' },
  completed: { color: 'green', label: '已完成' },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
