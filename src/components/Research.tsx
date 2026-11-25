import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api, Article } from '../services/api';
import ArticleModal from './ArticleModal';

const fallbackArticles: Article[] = [
  {
    id: 1,
    category: 'Sosial',
    slug: 'pergeseran-altruisme-perkotaan',
    title: 'Pergeseran Altruisme Perkotaan di Abad ke-21',
    date: '24 Okt 2023',
    description: 'Analisis tentang bagaimana konektivitas digital mengubah cara kita memandang dan mempraktikkan tanggung jawab sosial.',
    content: 'Konektivitas digital telah mengubah lanskap interaksi manusia secara mendasar. Di lingkungan urban kontemporer, empati tidak lagi hanya terwujud dalam perjumpaan fisik, melainkan tersalurkan melalui jejaring komputasi. Fenomena ini menciptakan paradoks: di satu sisi, kepedulian dapat digerakkan dalam hitungan detik lintas benua; di sisi lain, kedalaman relasi emosional sering kali tereduksi menjadi sekadar gestur digital semu.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
    author: 'Tim Riset Salimna',
    read_time: '6 mnt',
    is_published: 1,
  },
  {
    id: 2,
    category: 'Alam',
    slug: 'pola-geometri-suci-flora-lokal',
    title: 'Pola yang Tak Terlihat: Geometri Suci pada Flora Lokal',
    date: '02 Nov 2023',
    description: 'Menjelajahi keindahan matematis dan simbolisme religius yang ditemukan dalam fenomena alam regional.',
    content: 'Alam semesta berbicara dalam bahasa proporsi yang teratur. Dari filotaksis daun hingga spiralling biji bunga matahari, pola rasio emas (golden ratio) dan deret Fibonacci mengalir secara konsisten.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    author: 'Tim Riset Salimna',
    read_time: '5 mnt',
    is_published: 1,
  },
  {
    id: 3,
    category: 'Religius',
    slug: 'asketisme-modern-keheningan',
    title: 'Asketisme Modern: Menemukan Keheningan di Dunia yang Bising',
    date: '15 Des 2023',
    description: 'Bagaimana praktik keagamaan tradisional diadaptasi oleh kaum muda untuk mengatasi kelelahan digital.',
    content: 'Di tengah arus notifikasi tanpa henti dan kejenuhan informasi, praktik asketisme kuno menemukan relevansi baru melalui perenungan hening dan kontemplasi mendalam.',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=800&auto=format&fit=crop',
    author: 'Tim Riset Salimna',
    read_time: '7 mnt',
    is_published: 1,
  },
];

export default function Research() {
  const cached = api.getCachedArticles();
  const [articles, setArticles] = useState<Article[]>(cached.length > 0 ? cached : fallbackArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getArticles()
      .then((data) => {
        if (isMounted && data && data.length > 0) setArticles(data);
      })
      .catch((err) => {
        console.warn('Menggunakan data riset lokal:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedArticles = articles.slice(0, 3);

  return (
    <section id="tulisan" className="pb-12 md:pb-14">
      <div className="wrap">
        <div className="section-head">
          <h2>Tulisan terbaru</h2>
          <Link to="/artikel">
            Lihat semua tulisan <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedArticles.map((article) => (
              <article
                key={article.id || article.title}
                onClick={() => setSelectedArticle(article)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-primary"
              >
                <div className="relative aspect-[1080/1350] overflow-hidden bg-paper">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink shadow-sm">
                    {article.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <span className="text-[12.5px] text-muted">
                    {article.date} · {article.read_time}
                  </span>
                  <h3 className="font-display text-[17px] font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                    {article.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted">{article.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-2.5 text-[13.5px] font-semibold text-primary">
                    <span>Baca selengkapnya</span>
                    <span className="font-normal text-muted">{article.author}</span>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </section>
  );
}
