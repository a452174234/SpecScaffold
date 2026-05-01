import { Spin } from 'antd';

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Spin size="large" tip="加载中..." />
    </div>
  );
}
