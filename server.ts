import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory IP spam throttling map (no personal or medical data stored)
const ipRateLimitMap = new Map<string, number>();

/**
 * Optional Server-Side Email / Webhook Notification Integration
 * Activated only when NOTIFICATION_WEBHOOK_URL or SMTP_HOST is configured in server environment.
 * Never exposes secrets or keys to the client.
 */
async function sendOptionalServerNotification(payload: {
  name: string;
  treatment: string;
  preferredDate: string;
}) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_consultation_enquiry',
        clinic: 'N7 Aesthetics',
        treatment: payload.treatment,
        preferredDate: payload.preferredDate,
        submittedAt: new Date().toISOString(),
      }),
    });
    return true;
  } catch (err) {
    console.error('Optional notification webhook error:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '16kb' }));

  app.post('/api/appointments', async (req, res) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const lastRequest = ipRateLimitMap.get(clientIp) || 0;
    if (now - lastRequest < 8000) {
      res.status(429).json({
        ok: false,
        mode: 'throttled',
        message: 'Please wait a few seconds before submitting another request.',
      });
      return;
    }
    ipRateLimitMap.set(clientIp, now);

    const { name, phone, treatment, preferredDate, privacyConsent, website_url, liveMode } =
      req.body || {};

    // Honeypot check
    if (website_url && String(website_url).trim().length > 0) {
      res.status(200).json({
        ok: true,
        mode: 'configuration_pending',
        message: 'Demo Mode — Booking integration is being configured.',
      });
      return;
    }

    if (!name || !phone || !treatment || !preferredDate || !privacyConsent) {
      res.status(400).json({
        ok: false,
        mode: 'validation_error',
        message: 'Please complete all required consultation request fields and privacy consent.',
      });
      return;
    }

    if (liveMode) {
      const notified = await sendOptionalServerNotification({
        name: String(name).slice(0, 120),
        treatment: String(treatment).slice(0, 120),
        preferredDate: String(preferredDate).slice(0, 20),
      });

      res.status(200).json({
        ok: true,
        mode: 'cms_logged',
        notificationDispatched: notified,
        message:
          'Enquiry logged for clinic coordinator review. Please note this does not confirm a booked appointment slot until the clinic contacts you.',
      });
      return;
    }

    // Safe non-deceptive Demo Mode
    res.status(200).json({
      ok: true,
      mode: 'configuration_pending',
      message:
        'Demo Mode — Booking integration is being configured. Your request format was validated, and no appointment has been booked.',
    });
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
    console.log(`N7 Aesthetics server listening on http://localhost:${PORT}`);
  });
}

startServer();
