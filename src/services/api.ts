// Client API Service for Salimna Platform

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

export const api = {
  // Products
  async getProducts(params?: { category?: string; search?: string; all?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.all) query.append('all', 'true');

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat produk dari server');
    const json = await res.json();
    return json.data || [];
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menambahkan produk');
    return json.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui produk');
    return json.data;
  },

  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus produk');
  },

  // Articles
  async getArticles(params?: { category?: string; search?: string; all?: boolean }): Promise<Article[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Semua') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.all) query.append('all', 'true');

    const res = await fetch(`${API_BASE}/articles?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat artikel dari server');
    const json = await res.json();
    return json.data || [];
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menambahkan artikel');
    return json.data;
  },

  async updateArticle(id: number, data: Partial<Article>): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui artikel');
    return json.data;
  },

  async deleteArticle(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus artikel');
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
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Gagal memuat daftar pesanan');
    const json = await res.json();
    return json.data || [];
  },

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui status pesanan');
    return json.data;
  },

  // Inquiries
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
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Gagal memuat statistik admin');
    const json = await res.json();
    return json.data;
  },
};
