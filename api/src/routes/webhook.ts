import { Router, Request, Response } from 'express';

export const moonpayWebhookRouter = Router();

moonpayWebhookRouter.post('/', (req: Request, res: Response) => {
  const signature = req.headers['x-moonpay-signature'] as string | undefined;
  if (!signature) {
    res.status(400).json({ error: 'missing signature header' });
    return;
  }

  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  try {
    const { moonpayService } = require('../services/moonpay');
    const isValid = moonpayService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      res.status(401).json({ error: 'invalid signature' });
      return;
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('webhook processing error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});
