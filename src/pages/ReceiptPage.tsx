import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api, OrderReceipt } from '../services/api';
import BrandLogo from '../components/BrandLogo';

const ORDER_STATUS_LABELS: Record<OrderReceipt['status'], string> = {
  pending: 'Menunggu Pembayaran',
  confirmed: 'Dikonfirmasi',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function ReceiptPage() {
  const { token = '' } = useParams();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    api
      .getOrderReceipt(token)
      .then((data) => {
        if (isMounted) setReceipt(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Nota tidak dapat dimuat.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-muted">Memuat nota...</main>;
  }

  if (error || !receipt) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-[14px] border border-line bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold text-ink">Nota tidak tersedia</h1>
          <p className="mt-2 text-sm text-muted">{error || 'Tautan nota tidak valid.'}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Salimna
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:py-12 print:bg-white print:p-0">
      <article className="mx-auto max-w-3xl rounded-[14px] border border-line bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col justify-between gap-5 border-b border-line pb-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight text-primary">
              <BrandLogo className="h-9 w-9" />
              Salimna
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold text-ink">Nota Pesanan</h1>
            <p className="mt-1 text-sm text-muted">Terima kasih telah berbelanja bersama kami.</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            <Printer className="h-4 w-4" /> Cetak / Simpan PDF
          </button>
        </header>

        <section className="grid gap-4 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nomor Pesanan</p>
            <p className="mt-1 font-mono text-lg font-bold text-ink">{receipt.order_number}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tanggal</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {new Date(receipt.created_at).toLocaleString('id-ID')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
            <p className="mt-1 text-sm font-bold text-primary">{ORDER_STATUS_LABELS[receipt.status]}</p>
          </div>
        </section>

        <section className="py-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Rincian Pesanan</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-3 font-semibold">Produk</th>
                  <th className="pb-3 text-center font-semibold">Jumlah</th>
                  <th className="pb-3 text-right font-semibold">Harga</th>
                  <th className="pb-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-b border-line/70">
                    <td className="py-3 font-medium text-ink">
                      {item.name}{item.size ? ` (${item.size})` : ''}
                    </td>
                    <td className="py-3 text-center text-muted">{item.qty}</td>
                    <td className="py-3 text-right text-muted">{formatRupiah(item.price)}</td>
                    <td className="py-3 text-right font-semibold text-ink">
                      {formatRupiah(item.price * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-5 text-right font-bold text-ink">Total</td>
                  <td className="pt-5 text-right font-display text-lg font-extrabold text-primary">
                    {formatRupiah(receipt.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <footer className="border-t border-line pt-5 text-center text-xs text-muted">
          Nota ini hanya menampilkan rincian pesanan dan status terkini.
        </footer>
      </article>
    </main>
  );
}
