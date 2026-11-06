
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(express.json({ limit: '12kb' }));
app.use(express.urlencoded({ extended: false, limit: '12kb' }));

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ||
    'https://cpwmoving.com,https://www.cpwmoving.com,https://delicate-block-b016.curtisaallen.workers.dev')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

app.use('/api/quote', (req, res, next) => {
  const origin = req.get('origin');

  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(
      origin && allowedOrigins.has(origin) ? 204 : 403
    );
  }

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({
      error: 'Origin not allowed.'
    });
  }

  next();
});

const quoteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

const clean = (value, max = 200) =>
  typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';

const validEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.length <= 254;

const validPhone = phone =>
  /^[+\d().\s-]{7,30}$/.test(phone);

const escapeHtml = s =>
  s.replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/quote', quoteLimit, async (req, res) => {
  const body = req.body || {};

  // Honeypot spam protection
  if (clean(body['bot-field'] || body.website)) {
    return res.json({ success: true });
  }

  const first = clean(
    body['first-name'] ?? body.firstName, 80
  );

  const last = clean(
    body['last-name'] ?? body.lastName, 80
  );

  const phone = clean(body.phone, 30);
  const email = clean(body.email, 254);

  const from = clean(
    body['moving-from'] ?? body.movingFrom, 200
  );

  const to = clean(
    body['moving-to'] ?? body.movingTo, 200
  );

  const date = clean(
    body['move-date'] ?? body.moveDate, 30
  );

  const type = clean(
    body['move-type'] ?? body.moveType, 60
  );

  if (
    ![first, last, from, to].every(v => v.length >= 1) ||
    !validPhone(phone) ||
    !validEmail(email)
  ) {
    return res.status(400).json({
      error: 'Please check the required fields and try again.'
    });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: 'Invalid move date.'
    });
  }

  const entries = [
    ['Name', `${first} ${last}`],
    ['Phone', phone],
    ['Email', email],
    ['Moving from', from],
    ['Moving to', to],
    ['Preferred move date', date || 'Not specified'],
    ['Move type', type || 'Not specified']
  ];

  const text = entries
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const html = `
    <h2>New CPW Moving Quote Request</h2>
    ${entries.map(([key, value]) => `
      <p>
        <strong>${escapeHtml(key)}:</strong>
        ${escapeHtml(value)}
      </p>
    `).join('')}
  `;

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ||
            'CPW Moving Co <quotes@cpwmoving.com>',
          to: [
            'curtisaallen@gmail.com',
            'warren.williams@jrautomation.com'
          ],
          reply_to: email,
          subject: 'New Moving Quote Request - CPW Moving Co.',
          text,
          html
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        'Resend API error:',
        response.status,
        errorText
      );

      return res.status(502).json({
        error: 'Email delivery service rejected the request.'
      });
    }

    const result = await response.json();

    console.log('Quote email accepted by Resend:', result.id);

    return res.json({ success: true });

  } catch (error) {
    console.error(
      'Quote email delivery failed:',
      error.message
    );

    return res.status(502).json({
      error: 'Unable to send your request. Please try again.'
    });
  }
});

app.listen(
  process.env.PORT || 3000,
  '0.0.0.0',
  () => console.log('CPW Moving API started')
);
