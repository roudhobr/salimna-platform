import { createHmac, timingSafeEqual } from 'node:crypto';

const getSecret = () => {
  const secret = process.env.ORDER_RECEIPT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('ORDER_RECEIPT_SECRET harus berisi minimal 32 byte acak.');
  }
  return secret;
};

export const isOrderReceiptConfigured = () => {
  const secret = process.env.ORDER_RECEIPT_SECRET;
  return Boolean(secret && Buffer.byteLength(secret, 'utf8') >= 32);
};

export const createOrderReceiptToken = (orderNumber: string) => {
  const payload = Buffer.from(orderNumber, 'utf8').toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

export const getOrderNumberFromReceiptToken = (token: string): string | null => {
  const [payload, signature, extra] = token.split('.');
  if (
    extra !== undefined ||
    !payload ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !signature ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return null;
  }

  const expected = createHmac('sha256', getSecret()).update(payload).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  const orderNumber = Buffer.from(payload, 'base64url').toString('utf8');
  return /^[A-Z0-9-]{1,80}$/i.test(orderNumber) ? orderNumber : null;
};
