export interface OrderWhatsAppPayload {
  order_number: string;
  customer_name?: string;
  customer_phone: string;
  items?: Array<{ name?: string; price?: number | string; qty?: number | string; size?: string }>;
  total_amount?: number | string;
}

const BANK_DETAILS = {
  bank: 'SEABANK',
  accountNumber: '901239310093',
  accountName: 'Mochammad Roudho Brammastyo',
};

export const formatRupiah = (value: number | string): string => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const normalizeWhatsAppNumber = (phone: string): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

export const buildOrderWhatsAppMessage = (order: OrderWhatsAppPayload): string => {
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

  const itemLines = items.length
    ? items
        .map((item) => {
          const name = item.name || 'Produk';
          const qty = Number(item.qty || 1);
          const price = Number(item.price || 0);
          const size = item.size ? ` (${item.size})` : '';
          const subtotal = price * qty;
          return `- ${name}${size} x${qty} = ${formatRupiah(subtotal)}`;
        })
        .join('\n')
    : '- Tidak ada item dalam pesanan';

  const total = formatRupiah(Number(order.total_amount || 0));

  return [
    `*ORDER ID:* ${order.order_number}`,
    '',
    '*📦 DETAIL PESANAN*',
    itemLines,
    '',
    `*💰 TOTAL PEMBAYARAN: ${total}*`,
    '',
    'Silakan melakukan pembayaran melalui:',
    `*🏦 Bank:* ${BANK_DETAILS.bank}`,
    `*💳 No. Rekening:* ${BANK_DETAILS.accountNumber}`,
    `*👤 Atas Nama:* ${BANK_DETAILS.accountName}`,
    '',
    'Setelah melakukan transfer, silakan kirimkan bukti pembayaran dengan mencantumkan **Order ID**',
  ].join('\n');
};

export const sendOrderWhatsAppMessage = async (order: OrderWhatsAppPayload): Promise<{ status: 'sent' | 'pending'; response?: any }> => {
  const apiKey = process.env.FONNTE_API_KEY;
  if (!apiKey) {
    return {
      status: 'pending',
      response: { message: 'FONNTE_API_KEY belum diatur; pesan belum dikirim' },
    };
  }

  const target = normalizeWhatsAppNumber(order.customer_phone || '');
  if (!target) {
    throw new Error('Nomor WhatsApp pelanggan tidak valid.');
  }

  const message = buildOrderWhatsAppMessage(order);
  const payload = new URLSearchParams({
    target,
    message,
  });

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  const rawText = await response.text();
  let parsed: any = {};

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok || parsed?.status === false) {
    const reason = parsed?.message || parsed?.error || rawText || 'Gagal mengirim pesan WhatsApp via Fonnte';
    throw new Error(reason);
  }

  return {
    status: 'sent',
    response: parsed,
  };
};
