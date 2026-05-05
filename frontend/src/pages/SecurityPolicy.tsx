import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Tag, Input, Button, Flex, message, Spin } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { apiGet, apiPut } from '../services/api';

const { Title } = Typography;

interface SecurityPolicy {
  id: string;
  projectId: string;
  highRiskTools: string[];
  highRiskPatterns: string[];
  readOnlyExternalTools: string[];
}

export function SecurityPolicy() {
  const { id: projectId } = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [highRiskTools, setHighRiskTools] = useState<string[]>([]);
  const [readOnlyTools, setReadOnlyTools] = useState<string[]>([]);
  const [dangerousPatterns, setDangerousPatterns] = useState<string[]>([]);

  const [newHighRisk, setNewHighRisk] = useState('');
  const [newReadOnly, setNewReadOnly] = useState('');
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    if (projectId) loadPolicy();
  }, [projectId]);

  async function loadPolicy() {
    try {
      const res = await apiGet<{ success: boolean; data: SecurityPolicy }>(
        `/projects/${projectId}/security/policy`,
      );
      if (res.success) {
        setPolicy(res.data);
        setHighRiskTools(res.data.highRiskTools);
        setReadOnlyTools(res.data.readOnlyExternalTools);
        setDangerousPatterns(res.data.highRiskPatterns);
      }
    } catch {
      console.error('加载安全策略失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    try {
      const res = await apiPut<{ success: boolean; data: SecurityPolicy; error?: { message: string } }>(
        `/projects/${projectId}/security/policy`,
        {
          highRiskTools,
          readOnlyExternalTools: readOnlyTools,
          highRiskPatterns: dangerousPatterns,
        },
      );
      if (res.success) {
        message.success('安全策略已更新');
        setPolicy(res.data);
      } else {
        message.error(res.error?.message || '更新失败');
      }
    } catch (err: any) {
      message.error(err.message || '网络错误');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!policy) return <Typography.Paragraph>加载安全策略失败，请检查后端服务是否正常</Typography.Paragraph>;

  function TagList({
    tags,
    setTags,
    newValue,
    setNewValue,
  }: {
    tags: string[];
    setTags: (v: string[]) => void;
    newValue: string;
    setNewValue: (v: string) => void;
  }) {
    return (
      <Flex wrap="wrap" gap="4px 8px">
        {tags.map((tag) => (
          <Tag
            key={tag}
            closable
            onClose={() => setTags(tags.filter((t) => t !== tag))}
            closeIcon={<CloseOutlined />}
          >
            {tag}
          </Tag>
        ))}
        <Input
          placeholder="添加工具"
          size="small"
          style={{ width: 120 }}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onPressEnter={() => {
            if (newValue.trim()) {
              setTags([...tags, newValue.trim()]);
              setNewValue('');
            }
          }}
        />
      </Flex>
    );
  }

  return (
    <div>
      <Title level={4}>安全策略配置</Title>

      <Card title="高风险工具" style={{ marginBottom: 16 }} data-testid="high-risk-tools">
        <TagList tags={highRiskTools} setTags={setHighRiskTools} newValue={newHighRisk} setNewValue={setNewHighRisk} />
      </Card>

      <Card title="只读工具" style={{ marginBottom: 16 }} data-testid="read-only-tools">
        <TagList tags={readOnlyTools} setTags={setReadOnlyTools} newValue={newReadOnly} setNewValue={setNewReadOnly} />
      </Card>

      <Card title="危险命令模式" style={{ marginBottom: 16 }} data-testid="dangerous-patterns">
        <TagList tags={dangerousPatterns} setTags={setDangerousPatterns} newValue={newPattern} setNewValue={setNewPattern} />
      </Card>

      <Button type="primary" loading={saving} onClick={handleSave} data-testid="save-button">
        保存
      </Button>
    </div>
  );
}
