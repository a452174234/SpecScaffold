import { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, message } from 'antd';
import { useParams } from 'react-router-dom';
import { apiGet, apiPatch } from '../services/api';

const { Title } = Typography;

interface Task {
  id: string;
  task_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

const statusColorMap: Record<string, string> = {
  pending: 'default',
  testing: 'processing',
  test_approved: 'blue',
  developing: 'orange',
  testing_pass: 'cyan',
  completed: 'green',
};

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  testing: '测试中',
  test_approved: '测试已审批',
  developing: '开发中',
  testing_pass: '测试通过',
  completed: '已完成',
};

export function TaskBoard() {
  const { id: projectId } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) loadTasks();
  }, [projectId]);

  async function loadTasks() {
    try {
      const res = await apiGet<{ success: boolean; data: Task[] }>(
        `/projects/${projectId}/tasks`,
      );
      if (res.success) setTasks(res.data);
    } catch {
      console.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      const res = await apiPatch<{ success: boolean }>(
        `/projects/${projectId}/tasks/${taskId}`,
        { status: newStatus },
      );
      if (res.success) {
        message.success('状态已更新');
        loadTasks();
      }
    } catch {
      message.error('更新失败');
    }
  }

  const columns = [
    { title: '任务ID', dataIndex: 'task_id', key: 'task_id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => <Tag color={statusColorMap[v]}>{statusLabelMap[v] || v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Task) => {
        if (record.status === 'pending') {
          return <Button size="small" onClick={() => handleStatusChange(record.id, 'testing')}>开始测试</Button>;
        }
        if (record.status === 'testing') {
          return <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'test_approved')}>审批通过</Button>;
        }
        if (record.status === 'test_approved') {
          return <Button size="small" onClick={() => handleStatusChange(record.id, 'developing')}>开始开发</Button>;
        }
        if (record.status === 'developing') {
          return <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'testing_pass')}>测试通过</Button>;
        }
        if (record.status === 'testing_pass') {
          return <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'completed')}>完成</Button>;
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <Title level={4}>任务面板</Title>
      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
      />
    </div>
  );
}
