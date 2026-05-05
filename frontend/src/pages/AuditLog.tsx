import { useEffect, useState } from 'react';
import { Table, Tag, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { apiGet } from '../services/api';

const { Title } = Typography;

interface AuditLogEntry {
  id: string;
  tool_name: string;
  operation: string;
  target: string;
  risk_level: string;
  is_in_project_scope: number;
  audit_result: string;
  operation_description: string;
  user_feedback: string | null;
  timestamp: string;
}

const riskColorMap: Record<string, string> = {
  high: 'red',
  low: 'orange',
  read_only: 'green',
  blocked: 'default',
};

const resultColorMap: Record<string, string> = {
  auto_allowed: 'green',
  user_approved: 'blue',
  user_rejected: 'red',
  blocked: 'default',
};

export function AuditLog() {
  const { id: projectId } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) loadLogs();
  }, [projectId]);

  async function loadLogs() {
    try {
      const res = await apiGet<{ success: boolean; data: AuditLogEntry[] }>(
        `/projects/${projectId}/security/audit-logs`,
      );
      if (res.success) setLogs(res.data);
    } catch {
      console.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    {
      title: '工具',
      dataIndex: 'tool_name',
      key: 'tool_name',
      width: 80,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 80,
      render: (v: string) => <Tag color={riskColorMap[v]}>{v}</Tag>,
    },
    { title: '操作', dataIndex: 'operation', key: 'operation', width: 120 },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
    },
    {
      title: '结果',
      dataIndex: 'audit_result',
      key: 'audit_result',
      width: 100,
      render: (v: string) => <Tag color={resultColorMap[v]}>{v}</Tag>,
    },
    {
      title: '说明',
      dataIndex: 'operation_description',
      key: 'operation_description',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Title level={4}>审计日志</Title>
      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
