import { useState } from 'react';
import { Button, Input, Card, Typography, Space, Tag, message } from 'antd';
import { useParams } from 'react-router-dom';
import { apiPost } from '../services/api';

const { Title, Paragraph, Text } = Typography;

export function AiWorkspace() {
  const { id: projectId } = useParams<{ id: string }>();
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');

  async function handleGenerateTests() {
    if (!taskId) { message.warning('请输入任务ID'); return; }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/ai/generate-tests`,
        { taskId },
      );
      if (res.success) {
        setSessionId(res.data.sessionId);
        addOutput(`[测试生成] 任务 ${taskId} - 会话 ${res.data.sessionId}`);
      }
    } catch { message.error('生成失败'); }
    finally { setLoading(false); }
  }

  async function handleImplement() {
    if (!taskId) { message.warning('请输入任务ID'); return; }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/ai/implement`,
        { taskId },
      );
      if (res.success) {
        addOutput(`[代码实现] 任务 ${taskId} - 会话 ${res.data.sessionId}`);
      }
    } catch { message.error('实现失败'); }
    finally { setLoading(false); }
  }

  async function handleRunTests() {
    if (!taskId) { message.warning('请输入任务ID'); return; }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/ai/run-tests`,
        { taskId },
      );
      if (res.success) {
        addOutput(`[运行测试] 任务 ${taskId} - 会话 ${res.data.sessionId}`);
      }
    } catch { message.error('运行失败'); }
    finally { setLoading(false); }
  }

  function addOutput(line: string) {
    setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  }

  return (
    <div>
      <Title level={4}>AI 工作区</Title>

      <Card title="任务操作" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Text>任务ID:</Text>
            <Input
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="例如：T001"
              style={{ width: 200 }}
            />
          </Space>
          <Space>
            <Button type="primary" loading={loading} onClick={handleGenerateTests}>
              生成测试（Red）
            </Button>
            <Button loading={loading} onClick={handleImplement}>
              实现代码（Green）
            </Button>
            <Button loading={loading} onClick={handleRunTests}>
              运行测试
            </Button>
          </Space>
          {sessionId && <Tag color="blue">会话: {sessionId}</Tag>}
        </Space>
      </Card>

      <Card title="AI 输出">
        <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, minHeight: 200, maxHeight: 400, overflow: 'auto' }}>
          {output.length === 0 ? (
            <Text type="secondary" style={{ color: '#666' }}>等待 AI 输出...</Text>
          ) : (
            output.map((line, i) => <div key={i}>{line}</div>)
          )}
        </div>
      </Card>
    </div>
  );
}
