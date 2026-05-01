import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createNodeWebSocket } from '@hono/node-ws';
import { projectRoutes } from './api/routes/projects';
import { sddRoutes } from './api/routes/sdd';
import { aiRoutes } from './api/routes/ai';
import { securityRoutes } from './api/routes/security';
import { taskRoutes } from './api/routes/tasks';
import { responseMiddleware } from './api/middleware/response';
import { errorHandler } from './api/middleware/error-handler';
import { hookApp } from './security/hook-handler';
import { getDb } from './db';

const app = new Hono();

app.use('*', cors());
app.use('*', responseMiddleware);
app.use('*', errorHandler);

app.route('/api/projects', projectRoutes);
app.route('/api/projects/:id/sdd', sddRoutes);
app.route('/api/projects/:id/ai', aiRoutes);
app.route('/api/projects/:id/security', securityRoutes);
app.route('/api/projects/:id/tasks', taskRoutes);
app.route('/api/audit', hookApp);
app.route('/api/tools', new Hono());

app.get('/api/health', (c) => c.json({ success: true, data: { status: 'ok' } }));

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get(
  '/ws',
  upgradeWebSocket(() => ({
    onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data.toString());
        console.log('WebSocket 收到消息:', data.type);
      } catch {
        console.error('无效的 WebSocket 消息');
      }
    },
    onClose() {
      console.log('WebSocket 连接关闭');
    },
  })),
);

const port = Number(process.env.PORT) || 3000;

// 初始化数据库
getDb();

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`SpecScaffold 后端服务已启动: http://localhost:${info.port}`);
});

injectWebSocket(server);
