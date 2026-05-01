import { Typography, Card, Tag } from 'antd';

const { Paragraph } = Typography;

interface TasksViewerProps {
  tasksFilePath: string;
  taskCount: number;
}

export function TasksViewer({ tasksFilePath, taskCount }: TasksViewerProps) {
  return (
    <Card title="任务列表" size="small">
      <Paragraph type="secondary">{tasksFilePath || '尚未生成任务文件'}</Paragraph>
      {taskCount > 0 && <Tag color="blue">{taskCount} 个任务</Tag>}
    </Card>
  );
}
