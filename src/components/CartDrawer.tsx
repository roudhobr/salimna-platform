import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, totalPrice, totalCount } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.shipping_address) {
      alert('Silakan lengkapi nama, nomor WhatsApp, dan alamat pengiriman.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await api.createOrder({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || 'customer@salimna.id',
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          size: i.size
        })),
        notes: formData.notes
      });

      setOrderSuccess(created);
      clearCart();
      setIsCheckingOut(false);
    } catch (err: any) {
      alert(`Gagal membuat pesanan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (!orderSuccess) return;
    const phone = '6282131653815';
    const itemsList = orderSuccess.items.map((i: any) => `- ${i.name} (Size ${i.size || 'L'} x ${i.qty})`).join('%0A');
    const msg = `Halo Salimna, saya ingin konfirmasi pesanan dengan nomor *${orderSuccess.order_number}*:%0A%0A*Nama:* ${orderSuccess.customer_name}%0A*Alamat:* ${orderSuccess.shipping_address}%0A%0A*Rincian Barang:*%0A${itemsList}%0A%0A*Total:* Rp ${Number(orderSuccess.total_amount).toLocaleString('id-ID')}%0A%0ATerima kasih!`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isSubmitting) {
                setIsCartOpen(false);
                setIsCheckingOut(false);
              }
            }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary p-2 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-black">
                      {orderSuccess ? 'Pesanan Berhasil!' : isCheckingOut ? 'Checkout Pesanan' : 'Keranjang Belanja'}
                    </h2>
                    <p className="text-xs text-black/50">
                      {orderSuccess ? 'Tersimpan di database SQLite' : `${totalCount} item dalam keranjang`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckingOut(false);
                    setOrderSuccess(null);
                  }}
                  className="p-2 text-black/40 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {orderSuccess ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                    </motion.div>
                    <h3 className="font-display text-xl font-bold text-black mb-1">Terima Kasih!</h3>
                    <p className="text-sm text-black/60 mb-4">
                      Pesanan Anda telah berhasil tercatat di sistem kami.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 border border-gray-100">
                      <div className="text-xs text-black/40 uppercase font-semibold mb-1">Nomor Pesanan</div>
                      <div className="font-mono font-bold text-primary text-base mb-3">{orderSuccess.order_number}</div>
                      <div className="text-xs text-black/60">
                        <span className="font-bold">Penerima:</span> {orderSuccess.customer_name} ({orderSuccess.customer_phone})
                      </div>
                      <div className="text-xs text-black/60 mt-1">
                        <span className="font-bold">Total Pembayaran:</span> Rp {Number(orderSuccess.total_amount).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleWhatsAppRedirect}
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        Konfirmasi via WhatsApp <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setOrderSuccess(null);
                          setIsCartOpen(false);
                        }}
                        className="text-xs font-semibold text-black/60 hover:text-black py-2"
                      >
                        Selesai & Lanjut Belanja
                      </button>
                    </div>
                  </div>
                ) : isCheckingOut ? (
                  <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        name="customer_name"
                        required
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        placeholder="Contoh: Ahmad Fauzi"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Nomor WhatsApp *</label>
                      <input
                        type="tel"
                        name="customer_phone"
                        required
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        placeholder="08123456789"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Email</label>
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        placeholder="nama@email.com"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Alamat Lengkap Pengiriman *</label>
                      <textarea
                        name="shipping_address"
                        required
                        rows={3}
                        value={formData.shipping_address}
                        onChange={handleInputChange}
                        placeholder="Jalan, No Rumah, Kelurahan, Kecamatan, Kota/Kab, Kode Pos"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Catatan Tambahan (Opsional)</label>
                      <input
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Ukuran khusus, instruksi kurir, dll."
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </form>
                ) : items.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-black/30">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-base text-black mb-1">Keranjang Masih Kosong</h3>
                    <p className="text-xs text-black/50 max-w-xs mx-auto">
                      Jelajahi koleksi kami dan temukan busana berfilosofi yang sesuai untuk Anda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map(item => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="flex gap-4 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-display font-bold text-sm text-black line-clamp-1">{item.name}</h4>
                              <button
                                onClick={() => removeFromCart(item.id, item.size)}
                                className="text-black/30 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-black/50">Ukuran: <span className="font-semibold text-black">{item.size}</span></p>
                            <p className="text-xs font-bold text-primary mt-1">{item.price_formatted}</p>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-gray-200 rounded-lg px-2 py-0.5 gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.size, item.qty - 1)}
                                className="text-black/40 hover:text-black"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-black w-4 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.size, item.qty + 1)}
                                className="text-black/40 hover:text-black"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs text-black/40">
                              Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!orderSuccess && items.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-black/60">Total Pembelian:</span>
                    <span className="font-display text-lg font-bold text-black">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {isCheckingOut ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="w-1/3 py-3 rounded-full font-bold text-xs border border-gray-200 text-black hover:bg-gray-100 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        form="checkout-form"
                        disabled={isSubmitting}
                        className="w-2/3 bg-primary text-white py-3 rounded-full font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                      >
                        {isSubmitting ? 'Memproses...' : 'Kirim Pesanan'} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full bg-primary text-white py-3.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25"
                    >
                      Lanjut ke Checkout <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
