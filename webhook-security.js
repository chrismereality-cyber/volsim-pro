import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'super-secret-key';

export function verifyWebhook(req) {
  const signature = req.headers['x-webhook-signature'];
  if (!signature) return false;

  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}
