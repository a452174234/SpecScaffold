import { Tag } from 'antd';

interface ToolCallStatusProps {
  tool: string;
  target: string;
  status: 'running' | 'completed' | 'failed';
}

const statusColorMap: Record<string, string> = {
  running: 'processing',
  completed: 'green',
  failed: 'red',
};

export function ToolCallStatus({ tool, target, status }: ToolCallStatusProps) {
  return (
    <div style={{ marginBottom: 4 }}>
      <Tag color={statusColorMap[status]}>{status === 'running' ? '执行中' : status === 'completed' ? '完成' : '失败'}</Tag>
      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{tool}: {target}</span>
    </div>
  );
}
