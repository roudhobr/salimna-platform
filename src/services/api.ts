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

export interface AdminSessionResponse {
  token: string;
  user: { username: string; role: string };
  expiresAt: number;
}

const API_BASE = '/api';

export const api = {
  async adminLogin(username: string, password: string): Promise<AdminSessionResponse> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login admin gagal');
    return json.data;
  },

  async adminLogout(token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Logout admin gagal');
  },

  async getAdminOrders(status?: string): Promise<Order[]> {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);

    const token = localStorage.getItem('salimna_admin_session_token') || sessionStorage.getItem('salimna_admin_session_token');
    const res = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memuat daftar pesanan admin');
    return json.data || [];
  },

  async deleteAdminOrder(id: number): Promise<void> {
    const token = localStorage.getItem('salimna_admin_session_token') || sessionStorage.getItem('salimna_admin_session_token');
    const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan admin');
  },

  async deleteOldAdminOrders(days: number, status: string): Promise<void> {
    const token = localStorage.getItem('salimna_admin_session_token') || sessionStorage.getItem('salimna_admin_session_token');
    const query = new URLSearchParams({ days: String(days), status });
    const res = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan lama');
  },

  async exportAdminOrdersCsv(status?: string): Promise<string> {
    const token = localStorage.getItem('salimna_admin_session_token') || sessionStorage.getItem('salimna_admin_session_token');
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);

    const res = await fetch(`${API_BASE}/admin/orders/export.csv?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
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

  async deleteOrder(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus pesanan');
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
