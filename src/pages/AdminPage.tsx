import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  Search,
  Lock,
  User,
  ShieldCheck,
  Download,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  EyeOff,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { api, Product, Article, Order, DashboardStats } from '../services/api';
import { supabase } from '../services/supabase';
import BrandLogo from '../components/BrandLogo';

const ADMIN_STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Menunggu Pembayaran',
  confirmed: 'Dikonfirmasi',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const ORDER_STATUS_MESSAGES: Record<Order['status'], string> = {
  pending: 'Pesanan Anda sudah kami terima dan sedang menunggu pembayaran.',
  confirmed: 'Pesanan Anda sudah dikonfirmasi dan sedang kami siapkan.',
  shipped: 'Pesanan Anda sudah dikirim. Silakan hubungi kami jika memerlukan informasi pengiriman.',
  completed: 'Pesanan Anda sudah selesai. Terima kasih telah berbelanja bersama Salimna.',
  cancelled: 'Pesanan Anda telah dibatalkan. Silakan hubungi kami jika ada pertanyaan.',
};

const normalizeWhatsAppNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

const getOrderStatusWhatsAppLink = (order: Order) => {
  const phone = normalizeWhatsAppNumber(order.customer_phone);
  if (!phone) return '';

  const receiptUrl = getOrderReceiptUrl(order);
  const message = [
    `Halo ${order.customer_name},`,
    '',
    `Kami ingin menginformasikan pembaruan untuk pesanan *${order.order_number}*.`,
    `Status terbaru: *${ORDER_STATUS_LABELS[order.status]}*.`,
    ORDER_STATUS_MESSAGES[order.status],
    ...(receiptUrl ? ['', `Nota online: ${receiptUrl}`] : []),
    '',
    'Terima kasih,',
    'Salimna',
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const getOrderReceiptUrl = (order: Order) =>
  order.receipt_token
    ? `${window.location.origin}/nota/${encodeURIComponent(order.receipt_token)}`
    : '';

// Helper untuk mengompresi dan mengubah file gambar menjadi data URL (Base64)
const compressAndConvertToBase64 = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar valid.'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Ukuran gambar maksimal 15 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'articles' | 'orders' | 'receipts' | 'appearance'>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>(['', '', '']);
  const [heroDrafts, setHeroDrafts] = useState<string[]>(['', '', '']);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState('');

  // Modals & form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  // State untuk upload gambar dan opsi URL
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showProductUrlInput, setShowProductUrlInput] = useState(false);
  const [showArticleUrlInput, setShowArticleUrlInput] = useState(false);

  const handleProductImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingImage(true);
    try {
      const base64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
        const base64 = await compressAndConvertToBase64(file, 1080, 1350, 0.85);
          base64List.push(base64);
        }
      }
      if (base64List.length > 0 && editingProduct) {
        const current = Array.isArray(editingProduct.images) ? editingProduct.images : [];
        setEditingProduct({
          ...editingProduct,
          images: [...current, ...base64List],
        });
      }
    } catch (err: any) {
      alert(`Gagal memproses gambar produk: ${err.message}`);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleArticleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingImage(true);
    try {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const base64 = await compressAndConvertToBase64(file);
        if (editingArticle) {
          setEditingArticle({
            ...editingArticle,
            image: base64,
          });
        }
      }
    } catch (err: any) {
      alert(`Gagal memproses gambar artikel: ${err.message}`);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleHeroImageFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingImage(true);
    setSettingsNotice('');
    try {
      const base64 = await compressAndConvertToBase64(files[0], 1920, 1080, 0.82);
      setHeroDrafts((prev) => {
        const next = [...prev];
        next[index] = base64;
        return next;
      });
    } catch (err: any) {
      alert(`Gagal memproses foto latar slide ${index + 1}: ${err.message}`);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleHeroDraftChange = (index: number, value: string) => {
    setHeroDrafts((prev) => {
      const next = [...prev];
      next[index] = value.trim();
      return next;
    });
    setSettingsNotice('');
  };

  const handleClearHeroDraft = (index: number) => {
    setHeroDrafts((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
    setSettingsNotice('');
  };

  const handleSaveHero = async () => {
    if (!heroDrafts.some(Boolean)) return;
    setSavingSettings(true);
    setSettingsNotice('');
    try {
      const data = await api.updateSettings({
        hero_image_1: heroDrafts[0] || '',
        hero_image_2: heroDrafts[1] || '',
        hero_image_3: heroDrafts[2] || '',
      });
      const saved = [
        data.hero_image_1 || '',
        data.hero_image_2 || '',
        data.hero_image_3 || '',
      ];
      setHeroImages(saved);
      setHeroDrafts(saved);
      window.dispatchEvent(new Event('salimna:hero-updated'));
      setSettingsNotice('Latar hero berhasil disimpan. Foto unggahan tersimpan di Supabase Storage.');
    } catch (err: any) {
      setSettingsNotice(err.message || 'Gagal menyimpan latar hero.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearAllHero = async () => {
    setSavingSettings(true);
    setSettingsNotice('');
    try {
      await api.updateSettings({ hero_image_1: '', hero_image_2: '', hero_image_3: '' });
      setHeroImages(['', '', '']);
      setHeroDrafts(['', '', '']);
      window.dispatchEvent(new Event('salimna:hero-updated'));
      setSettingsNotice('Semua latar hero dihapus. Hero kembali memakai latar gradien bawaan.');
    } catch (err: any) {
      setSettingsNotice(err.message || 'Gagal menghapus latar hero.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = loginForm.email.trim();
    const password = loginForm.password;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('Supabase tidak mengembalikan sesi login.');

      await api.getAdminSession(data.session.access_token);
      setIsAuthenticated(true);
      setLoginError('');
      return;
    } catch (err: any) {
      await supabase.auth.signOut({ scope: 'local' });
      setLoginError(err.message || 'Login admin gagal.');
    }
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.session) return;

      await api.getAdminSession(data.session.access_token);
      if (active) setIsAuthenticated(true);
    }).catch(async (err: any) => {
      await supabase.auth.signOut({ scope: 'local' });
      if (active) {
        setIsAuthenticated(false);
        setLoginError(err.message || 'Sesi Supabase tidak dapat diverifikasi.');
      }
    }).finally(() => {
      if (active) setIsCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err: any) {
      console.error('Gagal mengakhiri sesi Supabase:', err);
      await supabase.auth.signOut({ scope: 'local' });
      alert(err.message || 'Gagal mengakhiri sesi Supabase.');
    } finally {
      setIsAuthenticated(false);
      setLoginForm({ email: '', password: '' });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [statsData, prodsData, artsData, ordersData, settingsData] = await Promise.all([
        api.getStats(),
        api.getProducts({ all: true }),
        api.getArticles({ all: true }),
        api.getAdminOrders(orderFilter),
        api.getSettings().catch(() => api.getCachedSettings()),
      ]);

      setStats(statsData);
      setProducts(prodsData);
      setArticles(artsData);
      setOrders(ordersData);
      const heroFromSettings = [
        settingsData.hero_image_1 || settingsData.hero_image || '',
        settingsData.hero_image_2 || '',
        settingsData.hero_image_3 || '',
      ];
      setHeroImages(heroFromSettings);
      setHeroDrafts(heroFromSettings);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setLoadError(err.message || 'Gagal memuat data admin.');
      if (err.message?.toLowerCase().includes('unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, orderFilter]);

  const handleDeleteOldOrders = async () => {
    const daysInput = prompt('Hapus pesanan lama lebih dari berapa hari? (contoh: 30)', '30');
    const days = Number(daysInput || 0);
    if (!days || days <= 0) return;

    const statusInput = prompt('Status yang akan dihapus? (all/completed/cancelled)', 'completed');
    const status = statusInput || 'completed';

    try {
      await api.deleteOldAdminOrders(days, status);
      loadData();
      alert('Pesanan lama berhasil dihapus.');
    } catch (err: any) {
      alert(`Gagal menghapus pesanan lama: ${err.message}`);
    }
  };

  const handleExportOrders = async () => {
    try {
      const csv = await api.exportAdminOrdersCsv(orderFilter);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salimna-orders-${orderFilter || 'all'}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mengekspor data order: ${err.message}`);
    }
  };

  // Product handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category) {
      alert('Nama, harga, dan kategori produk wajib diisi.');
      return;
    }

    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.createProduct(editingProduct);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan produk: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Produk ini akan diarsipkan dan tidak lagi tampil di katalog. Lanjutkan?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus produk: ${err.message}`);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { is_active: product.is_active ? 0 : 1 });
      await loadData();
    } catch (err: any) {
      alert(`Gagal memperbarui status produk: ${err.message}`);
    }
  };

  // Article handlers
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle?.description || !editingArticle?.content) {
      alert('Judul, deskripsi, dan isi artikel wajib diisi.');
      return;
    }

    try {
      if (editingArticle.id) {
        await api.updateArticle(editingArticle.id, editingArticle);
      } else {
        await api.createArticle(editingArticle);
      }
      setShowArticleModal(false);
      setEditingArticle(null);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan artikel: ${err.message}`);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel riset ini?')) return;
    try {
      await api.deleteArticle(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus artikel: ${err.message}`);
    }
  };

  const handleToggleArticle = async (article: Article) => {
    try {
      await api.updateArticle(article.id, { is_published: article.is_published ? 0 : 1 });
      await loadData();
    } catch (err: any) {
      alert(`Gagal memperbarui status artikel: ${err.message}`);
    }
  };

  // Order handler
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, newStatus);
      setOrders((currentOrders) => {
        const updatedOrders = currentOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        );
        return orderFilter !== 'all' && updatedOrder.status !== orderFilter
          ? updatedOrders.filter((order) => order.id !== updatedOrder.id)
          : updatedOrders;
      });
    } catch (err: any) {
      alert(`Gagal memperbarui status pesanan: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) return;

    try {
      await api.deleteAdminOrder(orderId);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus pesanan: ${err.message}`);
    }
  };

  const handleCopyOrderReceiptLink = async (order: Order) => {
    const receiptUrl = getOrderReceiptUrl(order);
    if (!receiptUrl) {
      alert('Link nota belum tersedia. Pastikan ORDER_RECEIPT_SECRET sudah dikonfigurasi.');
      return;
    }

    try {
      await navigator.clipboard.writeText(receiptUrl);
      alert('Link nota berhasil disalin.');
    } catch {
      window.prompt('Salin link nota berikut:', receiptUrl);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 pt-10 pb-16">
        <div className="text-sm font-semibold text-muted">Memeriksa sesi admin...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 pt-10 pb-16">
        <div className="w-full max-w-md bg-white rounded-[14px] border border-line shadow-[0_30px_80px_-40px_rgba(28,35,64,0.4)] p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 text-primary p-3 rounded-full">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/70">Area Terbatas</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink mt-2">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Email Supabase</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-line bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-line bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {loginError && (
              <div className="rounded-[10px] border border-rust/25 bg-rust/10 px-3 py-2 text-xs text-rust">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white rounded-full py-3 text-sm font-bold hover:bg-primary-dark transition-colors"
            >
              Masuk ke Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink pt-10 pb-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-[14px] border border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Panel Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10" />
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ink">
                Salimna <span className="text-primary italic">Admin Dashboard</span>
              </h1>
            </div>
            <p className="text-xs text-muted">
              Kelola katalog, artikel, stok, pesanan, nota, dan tampilan situs dalam satu tempat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportOrders}
              className="border border-line bg-white text-ink hover:border-primary hover:text-primary px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={handleDeleteOldOrders}
              className="border border-line bg-white text-muted hover:border-rust hover:text-rust px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Pesanan Lama
            </button>
            <button
              onClick={loadData}
              className="border border-line bg-white text-ink hover:border-primary hover:text-primary px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="border border-line bg-white text-rust hover:border-rust hover:bg-rust/5 px-4 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mb-5 rounded-[10px] border border-rust/25 bg-rust/10 px-4 py-3 text-sm text-rust">
            Gagal memuat data admin: {loadError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {[
            { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
            { id: 'products', label: `Katalog Produk (${products.length})`, icon: ShoppingBag },
            { id: 'articles', label: `Artikel Riset (${articles.length})`, icon: BookOpen },
            { id: 'orders', label: `Pesanan (${orders.length})`, icon: Package },
            { id: 'receipts', label: `Kumpulan Nota (${orders.length})`, icon: FileText },
            { id: 'appearance', label: 'Tampilan Hero', icon: ImageIcon },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-white text-ink/70 hover:text-ink border border-line hover:border-ink/30'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[14px] border border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted font-semibold">Total Omset</span>
                  <div className="w-8 h-8 rounded-full bg-leaf/10 text-leaf flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                  {stats?.totalRevenueFormatted || 'Rp 0'}
                </div>
                <div className="text-[10px] text-leaf font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Dari pesanan aktif
                </div>
              </div>

              <div className="bg-white p-5 rounded-[14px] border border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted font-semibold">Total Pesanan</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                  {stats?.totalOrders ?? orders.length}
                </div>
                <div className="text-[10px] text-muted mt-1">Pesanan tersimpan di Supabase</div>
              </div>

              <div className="bg-white p-5 rounded-[14px] border border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted font-semibold">Koleksi Produk</span>
                  <div className="w-8 h-8 rounded-full bg-sun/20 text-ink flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                  {stats?.totalProducts ?? products.length}
                </div>
                <div className="text-[10px] text-muted mt-1">Katalog aktif</div>
              </div>

              <div className="bg-white p-5 rounded-[14px] border border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted font-semibold">Artikel Riset</span>
                  <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                  {stats?.totalArticles ?? articles.length}
                </div>
                <div className="text-[10px] text-muted mt-1">Publikasi riset</div>
              </div>
            </div>

            {/* Recent Orders in Overview */}
            <div className="bg-white p-6 rounded-[14px] border border-line">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold tracking-tight text-base text-ink">Pesanan Terbaru</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Lihat Semua Pesanan
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-muted py-8 text-center">Belum ada transaksi pesanan masuk.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line text-muted uppercase tracking-wider">
                        <th className="pb-3 font-semibold">No. Pesanan</th>
                        <th className="pb-3 font-semibold">Pelanggan</th>
                        <th className="pb-3 font-semibold">Barang</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-paper">
                          <td className="py-3 font-mono font-bold text-primary">{o.order_number}</td>
                          <td className="py-3 font-medium">{o.customer_name}</td>
                          <td className="py-3 text-muted">
                            {o.items?.map((i: any) => `${i.name} (x${i.qty})`).join(', ')}
                          </td>
                          <td className="py-3 font-bold">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              o.status === 'confirmed' ? 'bg-primary/10 text-primary' :
                              o.status === 'shipped' ? 'bg-sun/20 text-ink' :
                              o.status === 'completed' ? 'bg-leaf/10 text-leaf' :
                              o.status === 'cancelled' ? 'bg-rust/10 text-rust' :
                              'bg-paper text-muted'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 rounded-[14px] border border-line space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-extrabold tracking-tight text-lg text-ink">Manajemen Katalog Produk</h3>
                <p className="text-xs text-muted">Kelola busana, harga, kategori, dan stok barang Salimna Cloth.</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'Salimna Cloth',
                    price: 249000,
                    stock: 20,
                    badge: 'Baru',
                    description: '',
                    buy_link: 'https://wa.me/6282131653815',
                    images: []
                  });
                  setShowProductModal(true);
                }}
                className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-primary-dark transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 rounded-[10px] border border-line flex gap-4 hover:border-ink/30 transition-colors">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-24 w-20 rounded-[10px] object-cover" />
                  ) : (
                    <div className="grid h-24 w-20 place-items-center rounded-[10px] bg-paper text-muted" aria-label="Foto produk tidak tersedia">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-muted">{p.category}</span>
                        {!p.is_active && (
                          <span className="bg-paper text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Diarsipkan
                          </span>
                        )}
                        {p.badge && (
                          <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-extrabold tracking-tight text-sm text-ink leading-tight mb-1">{p.name}</h4>
                      <p className="text-xs font-bold text-primary">{p.price_formatted}</p>
                      <p className="text-[11px] text-muted mt-1">Stok: <span className="font-semibold text-ink">{p.stock} pcs</span></p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line">
                      <button
                        onClick={() => handleToggleProduct(p)}
                        className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-paper transition-colors cursor-pointer"
                        title={p.is_active ? 'Arsipkan produk' : 'Aktifkan produk'}
                      >
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setShowProductModal(true);
                        }}
                        className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-paper transition-colors cursor-pointer"
                        title="Edit Produk"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-muted hover:text-rust rounded-full hover:bg-rust/10 transition-colors cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ARTICLES */}
        {activeTab === 'articles' && (
          <div className="bg-white p-6 rounded-[14px] border border-line space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-extrabold tracking-tight text-lg text-ink">Manajemen Artikel Riset</h3>
                <p className="text-xs text-muted">Tulis, edit, dan publikasikan artikel riset baru ke platform.</p>
              </div>
              <button
                onClick={() => {
                  setEditingArticle({
                    title: '',
                    category: 'Sosial',
                    date: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
                    description: '',
                    content: '',
                    author: 'Tim Riset Salimna',
                    read_time: '5 mnt',
                    image: ''
                  });
                  setShowArticleModal(true);
                }}
                className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-primary-dark transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tulis Riset Baru
              </button>
            </div>

            <div className="space-y-4">
              {articles.map(a => (
                <div key={a.id} className="p-4 rounded-[10px] border border-line flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-ink/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <img src={a.image} alt={a.title} className="w-16 h-16 rounded-[10px] object-cover" />
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {a.category} • {a.date} {!a.is_published && '• Draf'}
                      </span>
                      <h4 className="font-display font-extrabold tracking-tight text-sm text-ink">{a.title}</h4>
                      <p className="text-xs text-muted line-clamp-1 max-w-xl">{a.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleToggleArticle(a)}
                      className="px-3 py-1.5 text-xs font-semibold text-ink bg-paper hover:bg-line/60 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {a.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {a.is_published ? 'Tarik' : 'Terbitkan'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingArticle(a);
                        setShowArticleModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(a.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rust bg-rust/10 hover:bg-rust/15 rounded-full transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-[14px] border border-line space-y-6">
            <div>
              <h3 className="font-display font-extrabold tracking-tight text-lg text-ink">Daftar Semua Pesanan Masuk</h3>
              <p className="text-xs text-muted">Pantau detail pesanan pelanggan dan perbarui status pengiriman.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Cari order / nama / WA"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-[10px] border border-line bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-[10px] border border-line bg-white text-ink focus:outline-none focus:border-primary"
              >
                {ADMIN_STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'Semua status' : option}
                  </option>
                ))}
              </select>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-muted py-12 text-center">Belum ada pesanan yang masuk ke database.</p>
            ) : (
              <div className="space-y-4">
                {orders.filter(o => {
                  const term = searchQuery.toLowerCase();
                  if (!term) return true;
                  return `${o.order_number} ${o.customer_name} ${o.customer_phone} ${o.customer_email}`.toLowerCase().includes(term);
                }).map(o => {
                  const whatsappLink = getOrderStatusWhatsAppLink(o);
                  return (
                  <div key={o.id} className="p-5 rounded-[10px] border border-line bg-paper hover:bg-white hover:border-ink/30 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 pb-3 border-b border-line">
                      <div>
                        <span className="font-mono font-bold text-primary text-sm">{o.order_number}</span>
                        <span className="text-xs text-muted ml-3">{new Date(o.created_at).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted">Ubah Status:</span>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="text-xs font-bold bg-white border border-line rounded-full px-2.5 py-1 focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id)}
                          disabled={!['completed', 'cancelled'].includes(o.status)}
                          title="Hanya pesanan selesai atau dibatalkan yang bisa dihapus"
                          className="px-3 py-1.5 rounded-full bg-rust/10 text-rust text-[10px] font-bold hover:bg-rust/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-muted uppercase font-semibold text-[10px] mb-1">Data Pembeli</div>
                        <div className="font-bold text-ink">{o.customer_name}</div>
                        <div className="text-muted">WA: {o.customer_phone}</div>
                        <div className="text-muted">{o.customer_email}</div>
                      </div>
                      <div>
                        <div className="text-muted uppercase font-semibold text-[10px] mb-1">Alamat Pengiriman</div>
                        <div className="text-ink/80">{o.shipping_address}</div>
                        {o.notes && <div className="text-muted italic mt-1">Catatan: "{o.notes}"</div>}
                      </div>
                      <div>
                        <div className="text-muted uppercase font-semibold text-[10px] mb-1">Rincian Barang</div>
                        <ul className="space-y-1">
                          {o.items?.map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between">
                              <span>{item.name} ({item.size || 'L'}) x{item.qty}</span>
                              <span className="font-semibold">Rp {(Number(item.price) * Number(item.qty)).toLocaleString('id-ID')}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 pt-2 border-t border-line flex justify-between font-bold text-sm text-primary">
                          <span>Total Pembayaran:</span>
                          <span>Rp {Number(o.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {o.receipt_token && (
                        <button
                          type="button"
                          onClick={() => handleCopyOrderReceiptLink(o)}
                          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-primary hover:text-primary"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Salin Link Nota
                        </button>
                      )}
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#20ba59]"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Hubungi via WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs text-rust">Nomor WhatsApp pelanggan tidak valid.</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="space-y-4 rounded-[14px] border border-line bg-white p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">Kumpulan Nota Pesanan</h3>
                <p className="text-xs text-muted">Buka nota online atau salin link khusus untuk dibagikan ke pelanggan.</p>
              </div>
              <select
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
                aria-label="Filter nota berdasarkan status"
                className="rounded-[10px] border border-line bg-white px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              >
                {ADMIN_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Semua status' : status}
                  </option>
                ))}
              </select>
            </div>

            {orders.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted">Belum ada nota untuk status ini.</p>
            ) : (
              <div className="divide-y divide-line">
                {orders.map((order) => {
                  const receiptUrl = getOrderReceiptUrl(order);
                  return (
                    <article key={order.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-sm font-bold text-primary">{order.order_number}</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(order.created_at).toLocaleString('id-ID')} · {ORDER_STATUS_LABELS[order.status]}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatRupiah(Number(order.total_amount))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {receiptUrl ? (
                          <>
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
                            >
                              <FileText className="h-4 w-4" />
                              Buka Nota
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyOrderReceiptLink(order)}
                              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-primary hover:text-primary"
                            >
                              <LinkIcon className="h-4 w-4" />
                              Salin Link
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-rust">Konfigurasikan ORDER_RECEIPT_SECRET untuk membuat link nota.</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: APPEARANCE / HERO BACKGROUND */}
        {activeTab === 'appearance' && (
          <div className="bg-white p-6 rounded-[14px] border border-line space-y-5">
            <div>
              <h3 className="font-display font-extrabold tracking-tight text-lg text-ink">Latar Belakang Hero (3 Slide)</h3>
              <p className="text-xs text-muted">
                Setiap slide hero bisa memakai foto sendiri. Unggahan disimpan di Supabase Storage.
                Gunakan foto lanskap minimal 1600 × 900 px.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((index) => {
                const draft = heroDrafts[index] || '';
                const saved = heroImages[index] || '';
                return (
                  <div key={index} className="space-y-2.5 rounded-[10px] border border-line p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Slide {index + 1}</span>
                      {saved ? (
                        <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-[10px] font-bold text-leaf">Tersimpan</span>
                      ) : (
                        <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">Kosong</span>
                      )}
                    </div>

                    <div className="relative aspect-[16/9] overflow-hidden rounded-[10px] border border-line bg-ink">
                      {draft ? (
                        <>
                          <img
                            src={draft}
                            alt={`Pratinjau slide ${index + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-ink/40" />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/60">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-[10px]">Belum ada foto</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <label
                        htmlFor={`hero-image-upload-${index}`}
                        className={`inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white transition-colors ${
                          isProcessingImage ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-primary-dark'
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {isProcessingImage ? 'Memproses...' : 'Pilih Foto'}
                      </label>
                      <input
                        id={`hero-image-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleHeroImageFile(index, e)}
                        className="hidden"
                      />
                      {draft && (
                        <button
                          type="button"
                          onClick={() => handleClearHeroDraft(index)}
                          className="rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-rust transition-colors hover:border-rust hover:bg-rust/5"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={draft.startsWith('data:') ? '' : draft}
                      onChange={(e) => handleHeroDraftChange(index, e.target.value)}
                      placeholder="URL foto (opsional)"
                      className="w-full rounded-[10px] border border-line bg-white px-2.5 py-1.5 text-[11px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={handleSaveHero}
                disabled={savingSettings || !heroDrafts.some(Boolean)}
                className="rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan 3 Latar'}
              </button>
              <button
                type="button"
                onClick={handleClearAllHero}
                disabled={savingSettings || !heroImages.some(Boolean)}
                className="rounded-full border border-line px-5 py-2.5 text-xs font-bold text-rust transition-colors hover:border-rust hover:bg-rust/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hapus Semua
              </button>
            </div>

            <p className="text-[11px] text-muted">
              Foto yang diunggah akan disimpan di Supabase Storage. Jika belum ada foto tersimpan, hero hanya memakai latar grafis.
            </p>

            {settingsNotice && (
              <div className="rounded-[10px] border border-line bg-paper px-3 py-2 text-xs text-ink">
                {settingsNotice}
              </div>
            )}
          </div>
        )}

        {/* MODAL EDIT/ADD PRODUCT */}
        {showProductModal && editingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/45 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[14px] max-w-lg w-full p-6 shadow-[0_30px_80px_-30px_rgba(28,35,64,0.45)] relative">
              <button
                onClick={() => setShowProductModal(false)}
                className="absolute top-5 right-5 text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-extrabold tracking-tight text-lg text-ink mb-4">
                {editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">Kategori *</label>
                    <select
                      value={editingProduct.category || 'Salimna Cloth'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none bg-white"
                    >
                      <option value="Salimna Cloth">Salimna Cloth</option>
                      <option value="Edisi Terbatas">Edisi Terbatas</option>
                      <option value="Esensial">Esensial</option>
                      <option value="Aksesori">Aksesori</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Harga (IDR) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">Stok Tersedia</label>
                    <input
                      type="number"
                      value={editingProduct.stock || 10}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Badge (Contoh: Terlaris, Baru)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                    />
                  </div>
                </div>
                {/* INPUT DATA GAMBAR PRODUK */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-ink flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Data Foto Produk (Type Gambar)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProductUrlInput(!showProductUrlInput)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showProductUrlInput ? 'Sembunyikan URL' : 'Opsi URL'}
                    </button>
                  </div>

                  {/* Dropzone Upload File Gambar */}
                  <label
                    htmlFor="product-image-upload"
                    className={`border-2 border-dashed rounded-[10px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isProcessingImage
                        ? 'opacity-50 border-line bg-paper pointer-events-none'
                        : 'border-line hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageFiles}
                      className="hidden"
                    />
                    <div className="bg-primary/10 text-primary p-2.5 rounded-full mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs text-ink">
                      {isProcessingImage ? 'Sedang memproses gambar...' : 'Klik untuk Pilih / Upload File Gambar'}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      Mendukung format JPG, PNG, WEBP (Bisa pilih beberapa gambar sekaligus)
                    </span>
                  </label>

                  {/* Pratinjau Daftar Foto Produk */}
                  {Array.isArray(editingProduct.images) && editingProduct.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-muted mb-1.5">
                        Foto Produk ({editingProduct.images.length}):
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {editingProduct.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-[10px] overflow-hidden border border-line aspect-square bg-paper">
                            <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                Utama
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(editingProduct.images || [])];
                                updated.splice(idx, 1);
                                setEditingProduct({ ...editingProduct, images: updated });
                              }}
                              className="absolute top-1 right-1 bg-rust/80 hover:bg-rust text-white p-1 rounded-full shadow transition-all cursor-pointer"
                              title="Hapus foto ini"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback Input URL jika diperlukan */}
                  {showProductUrlInput && (
                    <div className="mt-2.5 pt-2.5 border-t border-line">
                      <label className="block text-[11px] font-bold text-muted mb-1">
                        Atau masukkan URL gambar langsung
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="product-url-fallback-input"
                          type="text"
                          placeholder="https://..."
                          className="flex-1 px-3 py-1.5 text-xs border border-line rounded-[10px] focus:border-primary outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) {
                                const current = Array.isArray(editingProduct.images) ? editingProduct.images : [];
                                setEditingProduct({ ...editingProduct, images: [...current, val] });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('product-url-fallback-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const current = Array.isArray(editingProduct.images) ? editingProduct.images : [];
                              setEditingProduct({ ...editingProduct, images: [...current, input.value.trim()] });
                              input.value = '';
                            }
                          }}
                          className="px-3 py-1.5 bg-paper hover:bg-line/60 text-ink text-xs font-bold rounded-[10px] cursor-pointer"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Deskripsi Produk</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-line rounded-full font-bold text-ink hover:bg-paper cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary-dark cursor-pointer"
                  >
                    Simpan Produk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT/ADD ARTICLE */}
        {showArticleModal && editingArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/45 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[14px] max-w-xl w-full p-6 shadow-[0_30px_80px_-30px_rgba(28,35,64,0.45)] relative">
              <button
                onClick={() => setShowArticleModal(false)}
                className="absolute top-5 right-5 text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-extrabold tracking-tight text-lg text-ink mb-4">
                {editingArticle.id ? 'Edit Artikel Riset' : 'Tulis Artikel Riset Baru'}
              </h3>

              <form onSubmit={handleSaveArticle} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">Judul Riset *</label>
                  <input
                    type="text"
                    required
                    value={editingArticle.title || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">Kategori *</label>
                    <select
                      value={editingArticle.category || 'Sosial'}
                      onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none bg-white"
                    >
                      <option value="Sosial">Sosial</option>
                      <option value="Alam">Alam</option>
                      <option value="Religius">Religius</option>
                      <option value="Filosofi">Filosofi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Estimasi Waktu Baca</label>
                    <input
                      type="text"
                      value={editingArticle.read_time || '5 mnt'}
                      onChange={(e) => setEditingArticle({ ...editingArticle, read_time: e.target.value })}
                      className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                    />
                  </div>
                </div>
                {/* INPUT DATA GAMBAR HEADER ARTIKEL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-ink flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Data Foto Header Riset (Type Gambar)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowArticleUrlInput(!showArticleUrlInput)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showArticleUrlInput ? 'Sembunyikan URL' : 'Opsi URL'}
                    </button>
                  </div>

                  {/* Pratinjau Jika Sudah Ada Gambar */}
                  {editingArticle.image ? (
                    <div className="relative rounded-[10px] overflow-hidden border border-line bg-paper mb-2">
                      <img
                        src={editingArticle.image}
                        alt="Header Preview"
                        className="mx-auto max-h-64 w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-ink/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label
                          htmlFor="article-image-upload"
                          className="bg-white text-ink px-3 py-1.5 rounded-[10px] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-paper"
                        >
                          <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingArticle({ ...editingArticle, image: '' })}
                          className="bg-rust text-white px-3 py-1.5 rounded-[10px] font-bold text-xs flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone Upload File Gambar */
                    <label
                      htmlFor="article-image-upload"
                      className={`border-2 border-dashed rounded-[10px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isProcessingImage
                          ? 'opacity-50 border-line bg-paper pointer-events-none'
                          : 'border-line hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="bg-primary/10 text-primary p-2.5 rounded-full mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-xs text-ink">
                        {isProcessingImage ? 'Sedang memproses gambar...' : 'Klik untuk Pilih / Upload File Gambar Header'}
                      </span>
                      <span className="text-[10px] text-muted mt-0.5">
                        Mendukung format JPG, PNG, WEBP (Otomatis dioptimasi)
                      </span>
                    </label>
                  )}

                  <input
                    id="article-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleArticleImageFile}
                    className="hidden"
                  />
                  <p className="mt-1.5 text-[10px] text-muted">
                    Rasio disarankan 1080 × 1350 px (4:5). Foto otomatis diperkecil agar pas tanpa terpotong.
                  </p>

                  {/* Fallback Input URL jika diperlukan */}
                  {showArticleUrlInput && (
                    <div className="mt-2.5 pt-2.5 border-t border-line">
                      <label className="block text-[11px] font-bold text-muted mb-1">
                        Atau tempel URL gambar eksternal
                      </label>
                      <input
                        type="text"
                        value={editingArticle.image || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-xs border border-line rounded-[10px] focus:border-primary outline-none"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Deskripsi Singkat / Ringkasan *</label>
                  <textarea
                    rows={2}
                    required
                    value={editingArticle.description || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Isi Riset Lengkap *</label>
                  <textarea
                    rows={6}
                    required
                    value={editingArticle.content || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-[10px] focus:border-primary outline-none"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArticleModal(false)}
                    className="px-4 py-2 border border-line rounded-full font-bold text-ink hover:bg-paper cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary-dark cursor-pointer"
                  >
                    Publikasikan Riset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
