import type { Request, Response } from 'express';
import { app } from '../server/index.js';

export default function handler(req: Request, res: Response) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const routePath = requestUrl.searchParams.get('__route');

  if (routePath !== null) {
    requestUrl.searchParams.delete('__route');
    req.url = `/api/${routePath}${requestUrl.search}`;
  }

  return app(req, res);
}
