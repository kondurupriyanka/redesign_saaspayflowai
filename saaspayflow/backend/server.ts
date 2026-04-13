import 'dotenv/config';
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = _fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============= EXPRESS SERVER =============

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';
import { startDailyReminderJob } from './jobs/dailyReminderJob.js';

const app: Express = express();
const PORT = process.env.API_PORT || process.env.PORT || 3000;

// ============= MIDDLEWARE =============

// Trust the first proxy (required for Replit's reverse proxy)
app.set('trust proxy', 1);

app.use(helmet({ crossOriginEmbedderPolicy: false }));

// Allow all origins in development (Replit proxies requests)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing with raw body capture for webhooks
app.use(express.json({
  verify: (req: Request & { rawBody?: string }, _res, buf) => {
    if (req.originalUrl.includes('/webhooks/')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.use(requestLogger);

// ============= RATE LIMITING =============

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const publicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/invoices/public', publicLimiter);

// ============= ROUTES =============

app.use('/api', routes);

app.get('/api-health', (_req: Request, res: Response) => {
  res.json({ message: 'PayFlow AI API', version: '1.0.0', status: 'ok' });
});

// ============= ERROR HANDLING =============

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use(errorHandler);

// ============= SERVER START =============

export function startServer() {
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Routes at /api`);
  });

  startDailyReminderJob();

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });

  return server;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  startServer();
}

export default app;
