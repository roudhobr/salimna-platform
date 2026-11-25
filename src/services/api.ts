// Client API Service for Salimna Platform
import { supabase } from './supabase';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  price_formatted: string;
  category: string;
  images: string[];
  badge: string;
  description: string;
  buy_link: string;
  stock: number;
  is_active: number;
  created_at?: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  date: string;
  description: string;
  content: string;
  image: string;
  author: string;
  read_time: string;
  is_published: number;
  created_at?: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  size?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  receipt_token?: string;
}

export interface OrderReceipt {
  order_number: string;
  created_at: string;
  status: Order['status'];
  items: Array<Pick<OrderItem, 'name' | 'price' | 'qty' | 'size'>>;
  total_amount: number;
}

export interface SiteSettings {
  hero_image?: string;
  hero_image_1?: string;
  hero_image_2?: string;
  hero_image_3?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalArticles: number;
  totalOrders: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  recentOrders: Order[];
  recentArticles: Article[];
}

const API_BASE = '/api';

// Cache ringan (memori + localStorage) supaya data langsung tampil saat pindah
// halaman atau memuat ulang, lalu diperbarui di latar belakang.
const CACHE_KEYS = {
  products: 'salimna:cache:products',
  articles: 'salimna:cache:articles',
  settings: 'salimna:cache:settings',
};

const readCache = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeCache = (key: string, value: unknown) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage bisa penuh (mis. gambar base64); cache memori tetap dipakai.
  }
};

let productsCache: Product[] = readCache<Product[]>(CACHE_KEYS.products, []);
let articlesCache: Article[] = readCache<Article[]>(CACHE_KEYS.articles, []);
let settingsCache: SiteSettings = readCache<SiteSettings>(CACHE_KEYS.settings, {});

const setProductsCache = (data: Product[]) => {
  productsCache = data;
  writeCache(CACHE_KEYS.products, data);
};

const setArticlesCache = (data: Article[]) => {
  articlesCache = data;
  writeCache(CACHE_KEYS.articles, data);
};

const setSettingsCache = (data: SiteSettings) => {
  settingsCache = { ...settingsCache, ...data };
  writeCache(CACHE_KEYS.settings, settingsCache);
};

const adminHeaders = async (includeJsonContentType = false, token?: string): Promise<HeadersInit> => {
  let accessToken = token;
  if (!accessToken) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    accessToken = session?.access_token;
  }
  if (!accessToken) throw new Error('Sesi Supabase tidak ditemukan. Silakan login kembali.');

  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${accessToken}`,
  };
};

export const api = {
  getCachedProducts(): Product[] {
    return productsCache;
  },

  getCachedArticles(): Article[] {
    return articlesCache;
  },

  getCachedSettings(): SiteSettings {
    return settingsCache;
  },

  async getAdminSession(token?: string): Promise<{ email: string; role: string }> {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: await adminHeaders(false, token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Sesi admin tidak valid');
    return json.data;
  },

  async getAdminOrders(status?: string): Promise<Order[]> {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);

    const res = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memuat daftar pesanan admin');
    return json.data || [];
  },

  async deleteAdminOrder(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan admin');
  },

  async deleteOldAdminOrders(days: number, status: string): Promise<void> {
    const query = new URLSearchParams({ days: String(days), status });
    const res = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan lama');
  },

  async exportAdminOrdersCsv(status?: string): Promise<string> {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);

    const res = await fetch(`${API_BASE}/admin/orders/export.csv?${query.toString()}`, {
      headers: await adminHeaders(),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || 'Gagal mengekspor data order');
    }

    return await res.text();
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; all?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.all) query.append('all', 'true');

    const res = await fetch(`${API_BASE}/products?${query.toString()}`, {
      headers: params?.all ? await adminHeaders() : undefined,
    });
    if (!res.ok) throw new Error('Gagal memuat produk dari server');
    const json = await res.json();
    const data = (json.data || []) as Product[];
    const isDefaultQuery = !params?.category && !params?.search && !params?.all;
    if (isDefaultQuery) setProductsCache(data);
    return data;
  },

  async getProduct(idOrSlug: string | number): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    if (!res.ok) throw new Error('Produk tidak ditemukan');
    const json = await res.json();
    return json.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: await adminHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menambahkan produk');
    setProductsCache([...productsCache.filter((p) => p.id !== json.data.id), json.data]);
    return json.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: await adminHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui produk');
    setProductsCache(productsCache.map((p) => (p.id === json.data.id ? json.data : p)));
    return json.data;
  },

  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus produk');
    setProductsCache(productsCache.filter((p) => p.id !== id));
  },

  // Articles
  async getArticles(params?: { category?: string; search?: string; all?: boolean }): Promise<Article[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.all) query.append('all', 'true');

    const res = await fetch(`${API_BASE}/articles?${query.toString()}`, {
      headers: params?.all ? await adminHeaders() : undefined,
    });
    if (!res.ok) throw new Error('Gagal memuat artikel dari server');
    const json = await res.json();
    const data = (json.data || []) as Article[];
    const isDefaultQuery = !params?.category && !params?.search && !params?.all;
    if (isDefaultQuery) setArticlesCache(data);
    return data;
  },

  async getArticle(idOrSlug: string | number): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${idOrSlug}`);
    if (!res.ok) throw new Error('Artikel tidak ditemukan');
    const json = await res.json();
    return json.data;
  },

  async createArticle(data: Partial<Article>): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: await adminHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menambahkan artikel');
    setArticlesCache([...articlesCache.filter((a) => a.id !== json.data.id), json.data]);
    return json.data;
  },

  async updateArticle(id: number, data: Partial<Article>): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: 'PUT',
      headers: await adminHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui artikel');
    setArticlesCache(articlesCache.map((a) => (a.id === json.data.id ? json.data : a)));
    return json.data;
  },

  async deleteArticle(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus artikel');
    setArticlesCache(articlesCache.filter((a) => a.id !== id));
  },

  // Orders & Checkout
  async createOrder(data: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    items: OrderItem[];
    notes?: string;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal membuat pesanan');
    return json.data;
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`, { headers: await adminHeaders() });
    if (!res.ok) throw new Error('Gagal memuat daftar pesanan');
    const json = await res.json();
    return json.data || [];
  },

  async getOrderReceipt(token: string): Promise<OrderReceipt> {
    const res = await fetch(`${API_BASE}/receipts/${encodeURIComponent(token)}`);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || 'Nota tidak ditemukan');
    return json.data as OrderReceipt;
  },

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: await adminHeaders(true),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui status pesanan');
    return json.data;
  },

  async deleteOrder(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan');
  },

  // Visitor contact form
  async sendInquiry(data: { name: string; email: string; message: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal mengirim pesan');
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`, { headers: await adminHeaders() });
    if (!res.ok) throw new Error('Gagal memuat statistik admin');
    const json = await res.json();
    return json.data;
  },

  // Site settings (tampilan)
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || 'Gagal memuat pengaturan situs');
    const data = (json?.data || {}) as SiteSettings;
    setSettingsCache(data);
    return data;
  },

  async updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: await adminHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengaturan situs');
    const saved = (json.data || {}) as SiteSettings;
    setSettingsCache(saved);
    return saved;
  },
};
