import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import appointmentsHandler from './api/appointments';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(
    express.json({
      limit: '16kb',
    })
  );

  // Handle malformed JSON or oversized payload errors from express.json() consistently with /api/appointments
  app.use(
    (
      err: { status?: number; type?: string } | undefined,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (!err) {
        next();
        return;
      }
      if (err.type === 'entity.too.large' || err.status === 413) {
        res.status(413).json({
          ok: false,
          mode: 'payload_too_large',
          notificationStatus: 'not_attempted',
          notificationDispatched: false,
          message: 'Request payload exceeds the 16KB maximum limit.',
        });
        return;
      }
      if (err instanceof SyntaxError || err.type === 'entity.parse.failed' || err.status === 400) {
        res.status(400).json({
          ok: false,
          mode: 'malformed_request',
          notificationStatus: 'not_attempted',
          notificationDispatched: false,
          message: 'Malformed JSON request body.',
        });
        return;
      }
      next(err);
    }
  );

  // Delegate all methods on /api/appointments to the Vercel serverless handler
  app.all('/api/appointments', async (req, res) => {
    await appointmentsHandler(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`N7 Aesthetics dev server listening on http://localhost:${PORT}`);
  });
}

startServer();
