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
  Database,
  Search,
  Lock,
  User,
  ShieldCheck,
  Download
} from 'lucide-react';
import { api, Product, Article, Order, DashboardStats } from '../services/api';

const ADMIN_SESSION_KEY = 'salimna_admin_session';
const ADMIN_TOKEN_KEY = 'salimna_admin_session_token';
const ADMIN_ACCOUNT = {
  username: 'salimna',
  password: 'admin123',
  role: 'admin',
};

const ADMIN_STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

const getStoredAdminSession = () => {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!saved || !token) return null;

  try {
    const parsed = JSON.parse(saved);
    if (parsed?.role === ADMIN_ACCOUNT.role) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getStoredAdminSession()));
  const [loginForm, setLoginForm] = useState({ username: '', password: '', rememberMe: true });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'articles' | 'orders'>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [adminToken, setAdminToken] = useState<string | null>(() => (typeof window === 'undefined' ? null : localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || null));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  const saveAdminSession = (rememberMe: boolean) => {
    const session = {
      username: ADMIN_ACCOUNT.username,
      role: ADMIN_ACCOUNT.role,
      isAuthenticated: true,
      rememberMe,
    };

    if (rememberMe) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } else {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  const saveAdminToken = (token: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }

    setAdminToken(token);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = loginForm.username.trim();
    const password = loginForm.password;

    try {
      const session = await api.adminLogin(username, password);
      saveAdminToken(session.token, loginForm.rememberMe);
      saveAdminSession(loginForm.rememberMe);
      setIsAuthenticated(true);
      setLoginError('');
      return;
    } catch (err: any) {
      setLoginError(err.message || 'Login admin gagal.');
    }
  };

  const handleLogout = async () => {
    try {
      if (adminToken) {
        await api.adminLogout(adminToken);
      }
    } catch (err) {
      console.warn('Logout admin token tidak valid atau sudah expired:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminToken(null);
      setLoginForm({ username: '', password: '', rememberMe: true });
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, prodsData, artsData, ordersData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getProducts({ all: true }).catch(() => []),
        api.getArticles({ all: true }).catch(() => []),
        api.getAdminOrders(orderFilter)
      ]);

      setStats(statsData);
      setProducts(prodsData);
      setArticles(artsData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
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

    const statusInput = prompt('Status yang akan dihapus? (all/pending/confirmed/shipped/completed/cancelled)', 'completed');
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
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus produk: ${err.message}`);
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

  // Order handler
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadData();
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-28 pb-20">
        <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-200 shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/70">Area Terbatas</p>
            <h1 className="font-display text-3xl font-bold text-black mt-2">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="salimna"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-black/60">
              <input
                type="checkbox"
                checked={loginForm.rememberMe}
                onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Ingat saya
            </label>

            {loginError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white rounded-2xl py-3 text-sm font-bold hover:bg-primary/90 transition-colors shadow-md"
            >
              Masuk ke Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3" /> SQLite Connected
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-black">
              Salimna <span className="text-primary italic">Admin Dashboard</span>
            </h1>
            <p className="text-xs text-black/50">
              Kelola katalog busana, artikel riset, dan pantau pesanan pelanggan secara langsung di database SQLite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportOrders}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={handleDeleteOldOrders}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Pesanan Lama
            </button>
            <button
              onClick={loadData}
              className="bg-slate-100 hover:bg-slate-200 text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {[
            { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
            { id: 'products', label: `Katalog Produk (${products.length})`, icon: ShoppingBag },
            { id: 'articles', label: `Artikel Riset (${articles.length})`, icon: BookOpen },
            { id: 'orders', label: `Pesanan (${orders.length})`, icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-black/70 hover:text-black border border-slate-100 hover:border-slate-200'
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
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-black/50 font-semibold">Total Omset</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-black">
                  {stats?.totalRevenueFormatted || 'Rp 0'}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Dari pesanan aktif
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-black/50 font-semibold">Total Pesanan</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-black">
                  {stats?.totalOrders ?? orders.length}
                </div>
                <div className="text-[10px] text-black/40 mt-1">Pesanan tersimpan di SQLite</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-black/50 font-semibold">Koleksi Produk</span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-black">
                  {stats?.totalProducts ?? products.length}
                </div>
                <div className="text-[10px] text-black/40 mt-1">Katalog aktif</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-black/50 font-semibold">Artikel Riset</span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-black">
                  {stats?.totalArticles ?? articles.length}
                </div>
                <div className="text-[10px] text-black/40 mt-1">Publikasi riset</div>
              </div>
            </div>

            {/* Recent Orders in Overview */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-black">Pesanan Terbaru</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Lihat Semua Pesanan
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-black/40 py-8 text-center">Belum ada transaksi pesanan masuk.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-black/40 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">No. Pesanan</th>
                        <th className="pb-3 font-semibold">Pelanggan</th>
                        <th className="pb-3 font-semibold">Barang</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-primary">{o.order_number}</td>
                          <td className="py-3 font-medium">{o.customer_name}</td>
                          <td className="py-3 text-black/60">
                            {o.items?.map((i: any) => `${i.name} (x${i.qty})`).join(', ')}
                          </td>
                          <td className="py-3 font-bold">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              o.status === 'shipped' ? 'bg-amber-100 text-amber-700' :
                              o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-black">Manajemen Katalog Produk</h3>
                <p className="text-xs text-black/50">Kelola busana, harga, kategori, dan stok barang Salimna Cloth.</p>
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
                    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop']
                  });
                  setShowProductModal(true);
                }}
                className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-100 flex gap-4 hover:border-slate-200 transition-colors">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'}
                    alt={p.name}
                    className="w-20 h-24 rounded-xl object-cover"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-black/40">{p.category}</span>
                        {p.badge && (
                          <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-sm text-black leading-tight mb-1">{p.name}</h4>
                      <p className="text-xs font-bold text-primary">{p.price_formatted}</p>
                      <p className="text-[11px] text-black/50 mt-1">Stok: <span className="font-semibold text-black">{p.stock} pcs</span></p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setShowProductModal(true);
                        }}
                        className="p-1.5 text-black/60 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Edit Produk"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-black/40 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-black">Manajemen Artikel Riset</h3>
                <p className="text-xs text-black/50">Tulis, edit, dan publikasikan artikel riset baru ke platform.</p>
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
                    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop'
                  });
                  setShowArticleModal(true);
                }}
                className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tulis Riset Baru
              </button>
            </div>

            <div className="space-y-4">
              {articles.map(a => (
                <div key={a.id} className="p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-slate-200 transition-colors">
                  <div className="flex gap-4 items-center">
                    <img src={a.image} alt={a.title} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase">{a.category} • {a.date}</span>
                      <h4 className="font-display font-bold text-sm text-black">{a.title}</h4>
                      <p className="text-xs text-black/50 line-clamp-1 max-w-xl">{a.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setEditingArticle(a);
                        setShowArticleModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(a.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-black">Daftar Semua Pesanan Masuk</h3>
              <p className="text-xs text-black/50">Pantau detail pesanan pelanggan dan perbarui status pengiriman.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input
                  type="text"
                  placeholder="Cari order / nama / WA"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-primary"
                />
              </div>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-black focus:outline-none focus:border-primary"
              >
                {ADMIN_STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'Semua status' : option}
                  </option>
                ))}
              </select>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-black/40 py-12 text-center">Belum ada pesanan yang masuk ke database.</p>
            ) : (
              <div className="space-y-4">
                {orders.filter(o => {
                  const term = searchQuery.toLowerCase();
                  if (!term) return true;
                  return `${o.order_number} ${o.customer_name} ${o.customer_phone} ${o.customer_email}`.toLowerCase().includes(term);
                }).map(o => (
                  <div key={o.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                      <div>
                        <span className="font-mono font-bold text-primary text-sm">{o.order_number}</span>
                        <span className="text-xs text-black/40 ml-3">{new Date(o.created_at).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-black/60">Ubah Status:</span>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-primary cursor-pointer"
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
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-black/40 uppercase font-semibold text-[10px] mb-1">Data Pembeli</div>
                        <div className="font-bold text-black">{o.customer_name}</div>
                        <div className="text-black/60">WA: {o.customer_phone}</div>
                        <div className="text-black/60">{o.customer_email}</div>
                      </div>
                      <div>
                        <div className="text-black/40 uppercase font-semibold text-[10px] mb-1">Alamat Pengiriman</div>
                        <div className="text-black/80">{o.shipping_address}</div>
                        {o.notes && <div className="text-black/50 italic mt-1">Catatan: "{o.notes}"</div>}
                      </div>
                      <div>
                        <div className="text-black/40 uppercase font-semibold text-[10px] mb-1">Rincian Barang</div>
                        <ul className="space-y-1">
                          {o.items?.map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between">
                              <span>{item.name} ({item.size || 'L'}) x{item.qty}</span>
                              <span className="font-semibold">Rp {(Number(item.price) * Number(item.qty)).toLocaleString('id-ID')}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-primary">
                          <span>Total Pembayaran:</span>
                          <span>Rp {Number(o.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL EDIT/ADD PRODUCT */}
        {showProductModal && editingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowProductModal(false)}
                className="absolute top-5 right-5 text-black/40 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-lg text-black mb-4">
                {editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-black mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">Kategori *</label>
                    <select
                      value={editingProduct.category || 'Salimna Cloth'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none bg-white"
                    >
                      <option value="Salimna Cloth">Salimna Cloth</option>
                      <option value="Edisi Terbatas">Edisi Terbatas</option>
                      <option value="Esensial">Esensial</option>
                      <option value="Aksesori">Aksesori</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1">Harga (IDR) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">Stok Tersedia</label>
                    <input
                      type="number"
                      value={editingProduct.stock || 10}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1">Badge (Contoh: Terlaris, Baru)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">URL Gambar</label>
                  <input
                    type="text"
                    value={Array.isArray(editingProduct.images) ? editingProduct.images[0] : ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Deskripsi Produk</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90"
                  >
                    Simpan ke SQLite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT/ADD ARTICLE */}
        {showArticleModal && editingArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowArticleModal(false)}
                className="absolute top-5 right-5 text-black/40 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-lg text-black mb-4">
                {editingArticle.id ? 'Edit Artikel Riset' : 'Tulis Artikel Riset Baru'}
              </h3>

              <form onSubmit={handleSaveArticle} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-black mb-1">Judul Riset *</label>
                  <input
                    type="text"
                    required
                    value={editingArticle.title || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">Kategori *</label>
                    <select
                      value={editingArticle.category || 'Sosial'}
                      onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none bg-white"
                    >
                      <option value="Sosial">Sosial</option>
                      <option value="Alam">Alam</option>
                      <option value="Religius">Religius</option>
                      <option value="Filosofi">Filosofi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1">Estimasi Waktu Baca</label>
                    <input
                      type="text"
                      value={editingArticle.read_time || '5 mnt'}
                      onChange={(e) => setEditingArticle({ ...editingArticle, read_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">URL Gambar Header</label>
                  <input
                    type="text"
                    value={editingArticle.image || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Deskripsi Singkat / Ringkasan *</label>
                  <textarea
                    rows={2}
                    required
                    value={editingArticle.description || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Isi Riset Lengkap *</label>
                  <textarea
                    rows={6}
                    required
                    value={editingArticle.content || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:border-primary outline-none"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArticleModal(false)}
                    className="px-4 py-2 border rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90"
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
