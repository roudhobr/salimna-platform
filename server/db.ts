import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'salimna.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price INTEGER NOT NULL,
      price_formatted TEXT NOT NULL,
      category TEXT NOT NULL,
      images TEXT NOT NULL,
      badge TEXT DEFAULT '',
      description TEXT DEFAULT '',
      buy_link TEXT DEFAULT '',
      stock INTEGER DEFAULT 10,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT NOT NULL,
      author TEXT DEFAULT 'Tim Riset Salimna',
      read_time TEXT DEFAULT '5 mnt',
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      items TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if products table is empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    seedInitialData();
  }
}

export function seedInitialData() {
  console.log('🌱 Seeding initial database data...');

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (name, slug, price, price_formatted, category, images, badge, description, buy_link, stock, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const initialProducts = [
    {
      name: 'Revelation Shirt',
      slug: 'revelation-shirt',
      price: 249000,
      price_formatted: 'Rp 249.000',
      category: 'Salimna Cloth',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop'
      ]),
      badge: 'Terlaris',
      description: 'Baju lengan panjang katun premium kelas berat yang memadukan keindahan seni visual, kaligrafi Arab, dan pesan filosofis "Revelation: Light Over Darkness". Setiap helai kain menyiratkan perjalanan pengungkapan makna.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 25
    },
    {
      name: 'Tee Light Over Darkness',
      slug: 'tee-light-over-darkness',
      price: 199000,
      price_formatted: 'Rp 199.000',
      category: 'Edisi Terbatas',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1523381313430-8025287ade3b?q=80&w=800&auto=format&fit=crop'
      ]),
      badge: 'Baru',
      description: 'Kaos katun combed 24s dengan sablon dada simbolis. Mencerminkan filosofi inti Salimna: mengungkap kebenaran melalui ketekunan dan refleksi.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 30
    },
    {
      name: 'Hoodie Filosofi',
      slug: 'hoodie-filosofi',
      price: 399000,
      price_formatted: 'Rp 399.000',
      category: 'Esensial',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'
      ]),
      badge: 'Eksklusif',
      description: 'Hoodie hitam oversized 330 GSM dengan logo Salimna bordir presisi. Kain kelas berat untuk kenyamanan dan keawetan perjalanan kontemplasi Anda.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 15
    },
    {
      name: 'Totebag Salimna',
      slug: 'totebag-salimna',
      price: 89000,
      price_formatted: 'Rp 89.000',
      category: 'Aksesori',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'
      ]),
      badge: '',
      description: 'Totebag kanvas tebal ramah lingkungan untuk menemani membawa buku catatan dan bahan riset harian Anda.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 40
    }
  ];

  for (const p of initialProducts) {
    insertProduct.run(
      p.name,
      p.slug,
      p.price,
      p.price_formatted,
      p.category,
      p.images,
      p.badge,
      p.description,
      p.buy_link,
      p.stock
    );
  }

  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles (title, slug, category, date, description, content, image, author, read_time, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const initialArticles = [
    {
      title: 'Pergeseran Altruisme Perkotaan di Abad ke-21',
      slug: 'pergeseran-altruisme-perkotaan',
      category: 'Sosial',
      date: '24 Okt 2023',
      description: 'Analisis tentang bagaimana konektivitas digital mengubah cara kita memandang dan mempraktikkan tanggung jawab sosial.',
      content: 'Konektivitas digital telah mengubah lanskap interaksi manusia secara mendasar. Di lingkungan urban kontemporer, empati tidak lagi hanya terwujud dalam perjumpaan fisik, melainkan tersalurkan melalui jejaring komputasi. Fenomena ini menciptakan paradoks: di satu sisi, kepedulian dapat digerakkan dalam hitungan detik lintas benua; di sisi lain, kedalaman relasi emosional sering kali tereduksi menjadi sekadar gestur digital semu. Salimna meneliti bagaimana generasi muda menyikapi tantangan ini dengan merevitalisasi ruang-ruang komunal yang menggabungkan kesadaran spiritual dan tindakan nyata.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
      author: 'Tim Riset Salimna',
      read_time: '6 mnt'
    },
    {
      title: 'Pola yang Tak Terlihat: Geometri Suci pada Flora Lokal',
      slug: 'pola-geometri-suci-flora-lokal',
      category: 'Alam',
      date: '02 Nov 2023',
      description: 'Menjelajahi keindahan matematis dan simbolisme religius yang ditemukan dalam fenomena alam regional.',
      content: 'Alam semesta berbicara dalam bahasa proporsi yang teratur. Dari filotaksis daun hingga spiralling biji bunga matahari, pola rasio emas (golden ratio) dan deret Fibonacci mengalir secara konsisten. Kajian kami terhadap keanekaragaman flora lokal di Nusantara mengungkap bagaimana masyarakat tradisional sejak lama telah menginternalisasi pola-pola sakral ini ke dalam motif kain, ukiran arsitektur, dan filosofi hidup selaras dengan alam semesta.',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      author: 'Tim Riset Salimna',
      read_time: '5 mnt'
    },
    {
      title: 'Asketisme Modern: Menemukan Keheningan di Dunia yang Bising',
      slug: 'asketisme-modern-keheningan',
      category: 'Religius',
      date: '15 Des 2023',
      description: 'Bagaimana praktik keagamaan tradisional diadaptasi oleh kaum muda untuk mengatasi kelelahan digital.',
      content: 'Di tengah arus notifikasi tanpa henti dan kejenuhan informasi, praktik asketisme kuno menemukan relevansi baru. Bukan dalam bentuk pengasingan diri ke gua atau hutan, melainkan "digital fasting" dan perenungan hening terjadwal di tengah hiruk-pikuk kota. Riset kami mengamati bagaimana ritual zikir dan kontemplasi mendalam kini bertransformasi menjadi oase kesehatan mental bagi masyarakat modern yang merindukan kedamaian batin.',
      image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=800&auto=format&fit=crop',
      author: 'Tim Riset Salimna',
      read_time: '7 mnt'
    },
    {
      title: 'Estetika Kegelapan dan Cahaya: Makna Filosofis Seri Revelation',
      slug: 'estetika-kegelapan-dan-cahaya-revelation',
      category: 'Filosofi',
      date: '10 Jan 2024',
      description: 'Kajian konseptual mengenai bagaimana pakaian dapat menjadi media dialog intelektual dan perwujudan pesan pencerahan.',
      content: 'Seri "Revelation" dari Salimna Cloth bukan sekadar produk sandang, melainkan kanvas ideologis. Dengan tema "Light Over Darkness", desain kami menarasikan perjalanan manusia dari ketidaktahuan menuju kesadaran spiritual. Kami memadukan tipografi kontemporer dengan kaligrafi simbolik untuk mengingatkan pemakainya bahwa setiap kesulitan selalu memuat benih pencerahan.',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
      author: 'Tim Riset Salimna',
      read_time: '4 mnt'
    }
  ];

  for (const a of initialArticles) {
    insertArticle.run(
      a.title,
      a.slug,
      a.category,
      a.date,
      a.description,
      a.content,
      a.image,
      a.author,
      a.read_time
    );
  }

  // Seed sample order
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, items, total_amount, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run(
    'SLM-2026-001',
    'Ahmad Fauzi',
    'fauzi@example.com',
    '081234567890',
    'Jl. Kebon Jeruk No. 12, Jakarta Barat',
    JSON.stringify([
      { id: 1, name: 'Revelation Shirt', size: 'L', qty: 1, price: 249000 }
    ]),
    249000,
    'confirmed',
    'Mohon sertakan stiker Salimna'
  );

  console.log('✅ Initial database seed completed!');
}
