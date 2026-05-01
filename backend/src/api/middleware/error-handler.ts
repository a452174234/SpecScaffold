import type { MiddlewareHandler } from 'hono';

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error('未捕获异常:', err);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || '服务器内部错误',
        },
      },
      500,
    );
  }
};
