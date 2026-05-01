import type { MiddlewareHandler } from 'hono';

export const responseMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
};

export function success<T>(data: T, status = 200) {
  return { success: true as const, data };
}

export function error(code: string, message: string, status = 400) {
  return { success: false as const, error: { code, message } };
}
