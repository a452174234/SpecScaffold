import { useState } from 'react';
import { Steps, Button, Input, Typography, Card, Space, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { apiPost, apiGet } from '../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type SddStep = 'specify' | 'clarify' | 'plan' | 'tasks';

const steps = [
  { title: '功能描述', key: 'specify' as SddStep },
  { title: '澄清歧义', key: 'clarify' as SddStep },
  { title: '生成计划', key: 'plan' as SddStep },
  { title: '生成任务', key: 'tasks' as SddStep },
];

export function SddFlow() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [description, setDescription] = useState('');
  const [clarification, setClarification] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSpecify() {
    if (!description.trim()) {
      message.warning('请输入功能描述');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/specify`,
        { description },
      );
      if (res.success) {
        setResult(res.data);
        setCurrent(1);
        message.success('功能规格已生成');
      }
    } catch {
      message.error('生成失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }

  async function handleClarify() {
    if (!clarification.trim()) {
      setCurrent(2);
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/clarify`,
        { clarification },
      );
      if (res.success) {
        setCurrent(2);
        message.success('规格已更新');
      }
    } catch {
      message.error('澄清失败');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlan() {
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/plan`,
        {},
      );
      if (res.success) {
        setResult(res.data);
        setCurrent(3);
        message.success('实施计划已生成');
      }
    } catch {
      message.error('计划生成失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleTasks() {
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: any }>(
        `/projects/${projectId}/tasks`,
        {},
      );
      if (res.success) {
        setResult(res.data);
        message.success(`已生成 ${res.data.taskCount || 0} 个任务`);
      }
    } catch {
      message.error('任务生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Title level={4}>SDD 规格驱动开发流程</Title>

      <Steps current={current} items={steps.map((s) => ({ title: s.title }))} style={{ marginBottom: 32 }} />

      {current === 0 && (
        <Card title="描述你的功能需求">
          <TextArea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请用自然语言描述你想要的功能..."
          />
          <Button
            type="primary"
            loading={loading}
            onClick={handleSpecify}
            style={{ marginTop: 16 }}
          >
            生成功能规格
          </Button>
        </Card>
      )}

      {current === 1 && (
        <Card title="澄清规格歧义（可选）">
          <TextArea
            rows={4}
            value={clarification}
            onChange={(e) => setClarification(e.target.value)}
            placeholder="补充说明或澄清需求..."
          />
          <Space style={{ marginTop: 16 }}>
            <Button loading={loading} onClick={handleClarify}>
              提交澄清
            </Button>
            <Button type="primary" onClick={() => setCurrent(2)}>
              跳过，生成计划
            </Button>
          </Space>
        </Card>
      )}

      {current === 2 && (
        <Card title="生成实施计划">
          <Paragraph>基于功能规格，系统将生成技术实施计划。</Paragraph>
          <Button type="primary" loading={loading} onClick={handlePlan}>
            生成计划
          </Button>
        </Card>
      )}

      {current === 3 && (
        <Card title="生成任务列表">
          <Paragraph>基于实施计划，系统将生成具体的任务列表。</Paragraph>
          <Button type="primary" loading={loading} onClick={handleTasks}>
            生成任务
          </Button>
          {result?.taskCount !== undefined && (
            <Paragraph style={{ marginTop: 16 }}>
              已生成 {result.taskCount} 个任务
            </Paragraph>
          )}
        </Card>
      )}
    </div>
  );
}
