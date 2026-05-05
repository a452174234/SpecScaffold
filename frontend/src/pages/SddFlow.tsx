import { useState, useRef, useCallback, useEffect } from 'react';
import { Steps, Button, Input, Typography, Card, Space, message, Spin, Alert, Checkbox, Modal } from 'antd';
import { DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { apiPostSSE, apiGet, apiPost } from '../services/api';
import type { SSEEvent } from '../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type SddStep = 'specify' | 'clarify' | 'plan' | 'tasks';

const stepOrder: SddStep[] = ['specify', 'clarify', 'plan', 'tasks'];

const steps = [
  { title: '功能描述', key: 'specify' as SddStep },
  { title: '澄清歧义', key: 'clarify' as SddStep },
  { title: '生成计划', key: 'plan' as SddStep },
  { title: '任务列表', key: 'tasks' as SddStep },
];

interface StepResult {
  content?: string;
  sessionId?: string;
  tokenUsage?: { input: number; output: number };
  [key: string]: unknown;
}

export function SddFlow() {
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<SddStep, StepResult | null>>({
    specify: null,
    clarify: null,
    plan: null,
    tasks: null,
  });
  const [editedContent, setEditedContent] = useState<Record<SddStep, string>>({
    specify: '',
    clarify: '',
    plan: '',
    tasks: '',
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [upstreamModified, setUpstreamModified] = useState(false);
  const [highestCompleted, setHighestCompleted] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedStep, setLastFailedStep] = useState<SddStep | null>(null);
  const [rerunModalOpen, setRerunModalOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [...prev, text]);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await apiGet<{ success: boolean; data: any }>(`/projects/${projectId}/sdd/status`);
        if (res.success && res.data) {
          if (res.data.spec?.status === 'tasked') { setCurrentStep(3); setHighestCompleted(3); }
          else if (res.data.spec?.status === 'planned') { setCurrentStep(2); setHighestCompleted(2); }
          else if (res.data.spec?.status === 'clarified') { setCurrentStep(1); setHighestCompleted(1); }
        }
      } catch {
        // status endpoint not available, start fresh
      }
    })();
  }, [projectId]);

  async function runStep(step: SddStep, body: Record<string, string> = {}, onComplete?: () => void) {
    if (!projectId) return;
    setLoading(true);
    setLogs([]);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await apiPostSSE(
        `/projects/${projectId}/sdd/${step}/stream`,
        body,
        (event: SSEEvent) => {
          if (event.type === 'assistant') {
            const msg = event.content as any;
            const text = msg?.message?.content?.find((c: any) => c.type === 'text')?.text
              || (typeof event.content === 'string' ? event.content : '');
            addLog(text || '[思考中...]');
          } else if (event.type === 'tool_use') {
            const msg = event.content as any;
            const toolName = msg?.message?.content?.find((c: any) => c.type === 'tool_use')?.name
              || msg?.name || 'unknown';
            addLog(`[工具] ${toolName}`);
          } else if (event.type === 'tool_result') {
            addLog(`[结果] ok`);
          } else if (event.type === 'result') {
            const resultData = event.content as StepResult;
            setResults((prev) => ({ ...prev, [step]: resultData }));
            if (resultData.content) {
              setEditedContent((prev) => ({ ...prev, [step]: resultData.content! }));
            }
            const nextIndex = stepOrder.indexOf(step) + 1;
            if (nextIndex > highestCompleted) {
              setHighestCompleted(nextIndex);
            }
            if (nextIndex < stepOrder.length) {
              setCurrentStep(nextIndex);
            }
            onComplete?.();
          }
        },
        (error) => {
          setLastError(error.message);
          setLastFailedStep(step);
          message.error(error.message);
          setLoading(false);
        },
        controller.signal,
      );
    } catch {
      // aborted or network error
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }

  async function handleStart() {
    if (!description.trim()) {
      message.warning('请输入功能描述');
      return;
    }

    // T041: re-run detection
    if (results.specify) {
      setRerunModalOpen(true);
      return;
    }

    setLastError(null);
    setLastFailedStep(null);
    setCurrentStep(0);
    setUpstreamModified(false);
    await runStep('specify', { description });
  }

  function handleRerunChoice(createNew: boolean) {
    setRerunModalOpen(false);
    if (createNew) {
      setResults({ specify: null, clarify: null, plan: null, tasks: null });
      setEditedContent({ specify: '', clarify: '', plan: '', tasks: '' });
      setHighestCompleted(0);
      setCurrentStep(0);
      setUpstreamModified(false);
      setLastError(null);
      runStep('specify', { description });
    } else {
      // Update existing — just re-run specify
      runStep('specify', { description });
    }
  }

  async function handleRetry() {
    if (!lastFailedStep) return;
    setLastError(null);
    setLastFailedStep(null);
    const body: Record<string, string> = {};
    if (lastFailedStep === 'specify') body.description = description;
    await runStep(lastFailedStep, body);
  }

  async function handleConfirmAndNext(step: SddStep) {
    if (!projectId) return;
    const content = editedContent[step];

    try {
      await apiPost<{ success: boolean }>(`/projects/${projectId}/sdd/content/save`, {
        step,
        content,
      });
    } catch {
      // save failed, continue anyway
    }

    const nextIndex = stepOrder.indexOf(step) + 1;
    if (nextIndex < stepOrder.length) {
      const nextStep = stepOrder[nextIndex];
      const body: Record<string, string> = {};
      if (nextStep === 'clarify') body.clarification = '';
      if (nextStep === 'plan') body.guidance = '';
      if (nextStep === 'tasks') body.constraints = '';
      await runStep(nextStep, body);
    }
  }

  function handleStepClick(index: number) {
    if (index < highestCompleted && index < currentStep) {
      setUpstreamModified(true);
    }
    if (index <= highestCompleted) {
      setCurrentStep(index);
    }
  }

  function currentStepKey(): SddStep {
    return stepOrder[currentStep];
  }

  const currentResult = results[currentStepKey()];
  const currentEdited = editedContent[currentStepKey()];

  // Task card state for US3
  const [taskItems, setTaskItems] = useState<Array<{ id: string; text: string }>>([]);
  const [implementDone, setImplementDone] = useState(false);

  useEffect(() => {
    if (results.tasks?.content) {
      const lines = results.tasks.content.split('\n');
      const items: Array<{ id: string; text: string }> = [];
      for (const line of lines) {
        const match = line.match(/^- \[[ x]\] (T\d+)\s+(.*)/);
        if (match) {
          items.push({ id: match[1], text: match[2] });
        }
      }
      setTaskItems(items);
      setImplementDone(false);
    }
  }, [results.tasks?.content]);

  function updateTaskText(index: number, text: string) {
    setTaskItems((prev) => prev.map((t, i) => (i === index ? { ...t, text } : t)));
  }

  function deleteTask(index: number) {
    setTaskItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImplement() {
    if (!projectId) return;
    setLoading(true);
    setLogs([]);
    setImplementDone(false);
    try {
      await apiPostSSE(
        `/projects/${projectId}/sdd/implement/stream`,
        {},
        (event: SSEEvent) => {
          if (event.type === 'assistant') {
            const msg = event.content as any;
            const text = msg?.message?.content?.find((c: any) => c.type === 'text')?.text
              || (typeof event.content === 'string' ? event.content : '');
            addLog(text || '[执行中...]');
          } else if (event.type === 'tool_use') {
            const msg = event.content as any;
            const toolName = msg?.message?.content?.find((c: any) => c.type === 'tool_use')?.name
              || msg?.name || 'unknown';
            addLog(`[工具] ${toolName}`);
          } else if (event.type === 'tool_result') addLog('[结果] ok');
          else if (event.type === 'result') {
            setImplementDone(true);
            addLog('执行完成');
          }
        },
        (error) => { message.error(error.message); setLoading(false); },
      );
    } catch {
      // aborted
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Title level={4}>SDD 规格驱动开发流程</Title>

      <Steps
        current={currentStep}
        items={steps.map((s, i) => ({
          title: (
            <span
              style={{ cursor: i <= highestCompleted ? 'pointer' : 'default' }}
              onClick={() => handleStepClick(i)}
            >
              {s.title}
            </span>
          ),
        }))}
        style={{ marginBottom: 32 }}
      />

      {upstreamModified && (
        <Alert
          message="已修改上游内容，建议重新执行后续步骤"
          type="warning"
          showIcon
          closable
          onClose={() => setUpstreamModified(false)}
          style={{ marginBottom: 16 }}
        />
      )}

      {currentStep === 0 && !results.specify && (
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
            onClick={handleStart}
            style={{ marginTop: 16 }}
          >
            开始生成
          </Button>
        </Card>
      )}

      {(loading || logs.length > 0) && (
        <Card
          title="执行日志"
          data-testid="sdd-log-area"
          style={{ marginBottom: 16 }}
          size="small"
        >
          <div style={{ maxHeight: 200, overflow: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            {logs.map((log, i) => (
              <div key={i} style={{ padding: '2px 0' }}>{log}</div>
            ))}
            {loading && <Spin size="small" style={{ marginTop: 8 }} />}
          </div>
        </Card>
      )}

      {currentResult?.content && !loading && (
        <Card
          title={`${steps.find((s) => s.key === currentStepKey())?.title} 产出`}
          style={{ marginBottom: 16 }}
        >
          <div data-color-mode="light">
            <MDEditor
              value={currentEdited || currentResult.content}
              onChange={(val) => setEditedContent((prev) => ({ ...prev, [currentStepKey()]: val || '' }))}
              height={400}
            />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => handleConfirmAndNext(currentStepKey())}
            >
              确认，进入下一步
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && results.specify && !results.clarify && !loading && (
        <Card title="澄清规格歧义">
          <Paragraph>系统正在自动审查并补充规格文档...</Paragraph>
        </Card>
      )}

      {currentStep === 2 && !results.plan && !loading && (
        <Card title="生成实施计划">
          <Paragraph>基于功能规格，系统将生成技术实施计划。</Paragraph>
          <Button type="primary" loading={loading} onClick={() => runStep('plan', {})}>
            生成计划
          </Button>
        </Card>
      )}

      {currentStep === 3 && !results.tasks && !loading && (
        <Card title="任务列表">
          <Paragraph>基于实施计划，系统将生成具体的任务列表。</Paragraph>
          <Button type="primary" loading={loading} onClick={() => runStep('tasks', {})}>
            生成任务
          </Button>
        </Card>
      )}

      {results.tasks?.content && currentStep === 3 && !loading && (
        <Card title="任务列表">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {taskItems.map((task, i) => (
              <Card
                key={task.id}
                data-testid="task-card"
                size="small"
                style={{ border: '1px solid #d9d9d9' }}
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteTask(i)}
                    aria-label="删除"
                  />
                }
              >
                <Space>
                  <Checkbox checked={false} />
                  <span style={{ fontWeight: 600 }}>{task.id}</span>
                  <Input
                    value={task.text}
                    onChange={(e) => updateTaskText(i, e.target.value)}
                    variant="borderless"
                    style={{ width: 400 }}
                  />
                </Space>
              </Card>
            ))}
          </Space>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button type="primary" loading={loading} onClick={handleImplement}>
              开始执行
            </Button>
          </div>
          {implementDone && (
            <Alert
              message="执行完成"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {lastError && !loading && (
        <Alert
          message={lastError}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          action={
            <Button size="small" danger icon={<RedoOutlined />} onClick={handleRetry}>
              重试
            </Button>
          }
        />
      )}

      <Modal
        open={rerunModalOpen}
        title="重新开始 SDD 流程"
        onCancel={() => setRerunModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRerunModalOpen(false)}>取消</Button>,
          <Button key="update" onClick={() => handleRerunChoice(false)}>更新已有 spec</Button>,
          <Button key="new" type="primary" onClick={() => handleRerunChoice(true)}>创建新 spec</Button>,
        ]}
      >
        <Paragraph>检测到已有规格文档，请选择操作方式：</Paragraph>
      </Modal>
    </div>
  );
}
