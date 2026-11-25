import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { api, Article } from '../services/api';
import ArticleModal from '../components/ArticleModal';

const CATEGORIES = ['Semua', 'Sosial', 'Alam', 'Religius', 'Filosofi'];

export default function ArticlesPage() {
  const cachedArticles = api.getCachedArticles();
  const [articles, setArticles] = useState<Article[]>(cachedArticles);
  const [loading, setLoading] = useState(cachedArticles.length === 0);
  const [loadError, setLoadError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getArticles()
      .then((data) => {
        if (isMounted) setArticles(data || []);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message || 'Gagal memuat artikel dari Supabase.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = activeFilter === 'Semua' || article.category === activeFilter;
    const searchableText = [
      article.title,
      article.category,
      article.description,
      article.content,
      article.author,
    ].join(' ').toLocaleLowerCase();
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });

  return (
    <div className="min-h-screen bg-white text-ink">
      <main className="pb-16 pt-10">
        <div className="wrap">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl font-extrabold tracking-tight md:text-6xl"
              >
                Tulisan <span className="italic text-primary">Salimna</span>
              </motion.h1>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Riset dan refleksi seputar fenomena sosial, lingkungan hidup, dan praktik keagamaan —
                dibaca dengan jernih, ditanggapi dengan bijak.
              </p>
              <label className="relative mt-5 block w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul, kategori, atau isi tulisan"
                  aria-label="Cari tulisan"
                  className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveFilter(category)}
                  className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-bold transition-all ${
                    activeFilter === category
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-white text-ink hover:border-primary/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Memuat artikel...
            </div>
          ) : articles.length === 0 && loadError ? (
            <div role="alert" className="rounded-[14px] border border-rust/25 bg-rust/10 px-6 py-12 text-center text-sm text-rust">
              Artikel tidak dapat dimuat dari Supabase: {loadError}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-paper px-6 py-16 text-center">
              <p className="font-display text-lg font-extrabold text-ink">
                {normalizedSearch ? 'Tidak ada tulisan yang cocok dengan pencarian.' : 'Belum ada tulisan di kategori ini.'}
              </p>
              <p className="mt-1 text-sm text-muted">
                {normalizedSearch ? 'Coba kata kunci lain atau ubah kategori.' : 'Silakan pilih kategori lain.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article, index) => (
                <motion.article
                  key={article.id || article.slug || article.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                  onClick={() => setSelectedArticle(article)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedArticle(article);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-primary"
                >
                  <div className="relative aspect-[1080/1350] overflow-hidden bg-paper">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted" aria-label="Foto artikel tidak tersedia">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink shadow-sm">
                      {article.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <span className="text-[12.5px] text-muted">
                      {article.date} · {article.read_time}
                    </span>
                    <h2 className="font-display text-[17px] font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-primary">
                      {article.title}
                    </h2>
                    <p className="line-clamp-2 text-sm text-muted">{article.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-2.5 text-[13.5px] font-semibold text-primary">
                      <span>Baca selengkapnya</span>
                      <span className="font-normal text-muted">{article.author}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
