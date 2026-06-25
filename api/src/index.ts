import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { config } from './config';
import { fundingRouter } from './routes/funding';
import { quoteRouter } from './routes/quote';
import { statusRouter } from './routes/status';
import { offrampRouter } from './routes/offramp';
import { cexRouter } from './routes/cex';
import { moonpayWebhookRouter } from './routes/webhook';
import { apiKeyAuth } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { versionCompatibility } from './middleware/versioning';
import { rateLimitMiddleware, applyRateLimitHeaders } from './middleware/rateLimit';

export const logger = pino({ level: config.logLevel });

const app = express();

app.use(helmet());
app.use(cors());

app.use(versionCompatibility);
app.use(rateLimitMiddleware);
app.use(applyRateLimitHeaders);

app.use('/api/webhook', express.text({ type: '*/*' }));
app.use('/api', express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/v1/deprecations', (_req, res) => {
  res.json({
    version: 'v1',
    deprecated: true,
    sunset: '2027-12-31',
    features: [
      'legacy quote endpoints',
      'legacy funding routing',
      'legacy status polling',
    ],
  });
});

app.use('/api/v1/quote', apiKeyAuth, quoteRouter);
app.use('/api/v2/quote', apiKeyAuth, quoteRouter);
app.use('/api/v1/fund', apiKeyAuth, fundingRouter);
app.use('/api/v2/fund', apiKeyAuth, fundingRouter);
app.use('/api/v1/status', apiKeyAuth, statusRouter);
app.use('/api/v2/status', apiKeyAuth, statusRouter);
app.use('/api/v1/offramp', apiKeyAuth, offrampRouter);
app.use('/api/v2/offramp', apiKeyAuth, offrampRouter);
app.use('/api/v1/cex', apiKeyAuth, cexRouter);
app.use('/api/v2/cex', apiKeyAuth, cexRouter);
app.use('/api/quote', apiKeyAuth, quoteRouter);
app.use('/api/fund', apiKeyAuth, fundingRouter);
app.use('/api/status', apiKeyAuth, statusRouter);
app.use('/api/offramp', apiKeyAuth, offrampRouter);
app.use('/api/cex', apiKeyAuth, cexRouter);
app.use('/api/webhook/moonpay', moonpayWebhookRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, config.host, () => {
    logger.info({ port: config.port }, 'bridge api server started');
  });
}

export { app };
