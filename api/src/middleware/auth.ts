import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  if (config.apiKeys.length === 0) {
    return next();
  }

  const key = req.headers['x-api-key'] as string | undefined;
  if (!key || !config.apiKeys.includes(key)) {
    res.status(401).json({ error: 'unauthorized', message: 'invalid or missing API key' });
    return;
  }

  next();
}
