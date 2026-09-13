import { supabase, isSupabaseConfigured } from './supabase.js';

async function seedSupabase() {
  console.log('🌱 Memulai proses seeding data Salimna ke Supabase...');

  if (!isSupabaseConfigured()) {
    console.warn(`
  ⚠️  Kredensial SUPABASE_URL atau SUPABASE_ANON_KEY belum diisi di .env!
  Silakan isi file .env terlebih dahulu dengan URL dan Key dari dashboard Supabase Anda,
  atau jalankan script SQL yang tersedia di 'supabase/schema.sql' langsung pada SQL Editor Supabase.
    `);
    process.exit(1);
  }

  const initialProducts = [
    {
      name: 'Revelation Shirt',
      slug: 'revelation-shirt',
      price: 249000,
      price_formatted: 'Rp 249.000',
      category: 'Salimna Cloth',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop',
      ],
      badge: 'Terlaris',
      description: 'Baju lengan panjang katun premium kelas berat yang memadukan keindahan seni visual, kaligrafi Arab, dan pesan filosofis "Revelation: Light Over Darkness". Setiap helai kain menyiratkan perjalanan pengungkapan makna.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 25,
      is_active: 1,
    },
    {
      name: 'Tee Light Over Darkness',
      slug: 'tee-light-over-darkness',
      price: 199000,
      price_formatted: 'Rp 199.000',
      category: 'Edisi Terbatas',
      images: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1523381313430-8025287ade3b?q=80&w=800&auto=format&fit=crop',
      ],
      badge: 'Baru',
      description: 'Kaos katun combed 24s dengan sablon dada simbolis. Mencerminkan filosofi inti Salimna: mengungkap kebenaran melalui ketekunan dan refleksi.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 30,
      is_active: 1,
    },
    {
      name: 'Hoodie Filosofi',
      slug: 'hoodie-filosofi',
      price: 399000,
      price_formatted: 'Rp 399.000',
      category: 'Esensial',
      images: [
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
      ],
      badge: 'Eksklusif',
      description: 'Hoodie hitam oversized 330 GSM dengan logo Salimna bordir presisi. Kain kelas berat untuk kenyamanan dan keawetan perjalanan kontemplasi Anda.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 15,
      is_active: 1,
    },
    {
      name: 'Totebag Salimna',
      slug: 'totebag-salimna',
      price: 89000,
      price_formatted: 'Rp 89.000',
      category: 'Aksesori',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      ],
      badge: '',
      description: 'Totebag kanvas tebal ramah lingkungan untuk menemani membawa buku catatan dan bahan riset harian Anda.',
      buy_link: 'https://wa.me/6282131653815',
      stock: 40,
      is_active: 1,
    },
  ];

  console.log('📦 Seeding produk...');
  for (const product of initialProducts) {
    const { error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'slug' });

    if (error) {
      console.error(`Gagal menyimpan produk ${product.name}:`, error.message);
    } else {
      console.log(`  ✓ Produk: ${product.name}`);
    }
  }

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
      read_time: '6 mnt',
      is_published: 1,
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
      read_time: '5 mnt',
      is_published: 1,
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
      read_time: '7 mnt',
      is_published: 1,
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
      read_time: '4 mnt',
      is_published: 1,
    },
  ];

  console.log('📝 Seeding artikel...');
  for (const article of initialArticles) {
    const { error } = await supabase
      .from('articles')
      .upsert(article, { onConflict: 'slug' });

    if (error) {
      console.error(`Gagal menyimpan artikel ${article.title}:`, error.message);
    } else {
      console.log(`  ✓ Artikel: ${article.title}`);
    }
  }

  console.log('🛒 Seeding order sampel...');
  const { error: orderErr } = await supabase
    .from('orders')
    .upsert(
      {
        order_number: 'SLM-2026-001',
        customer_name: 'Ahmad Fauzi',
        customer_email: 'fauzi@example.com',
        customer_phone: '081234567890',
        shipping_address: 'Jl. Kebon Jeruk No. 12, Jakarta Barat',
        items: [
          { id: 1, name: 'Revelation Shirt', size: 'L', qty: 1, price: 249000 },
        ],
        total_amount: 249000,
        status: 'confirmed',
        notes: 'Mohon sertakan stiker Salimna',
      },
      { onConflict: 'order_number' }
    );

  if (orderErr) {
    console.error('Gagal menyimpan order sampel:', orderErr.message);
  } else {
    console.log('  ✓ Order sampel berhasil disimpan');
  }

  console.log('\n🎉 Seeding Supabase selesai dengan sukses!');
}

seedSupabase().catch((err) => {
  console.error('Terjadi kesalahan saat seeding:', err);
  process.exit(1);
});
