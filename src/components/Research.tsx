import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api, Article } from '../services/api';
import ArticleModal from './ArticleModal';

export default function Research() {
  const cached = api.getCachedArticles();
  const [articles, setArticles] = useState<Article[]>(cached);
  const [loading, setLoading] = useState(cached.length === 0);
  const [loadError, setLoadError] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getArticles()
      .then((data) => {
        if (isMounted) setArticles(data || []);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message || 'Gagal memuat tulisan dari Supabase.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
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

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Memuat tulisan...
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-[14px] border border-line bg-paper px-6 py-10 text-center text-sm text-muted">
            {loadError ? `Tulisan tidak dapat dimuat: ${loadError}` : 'Belum ada tulisan di Supabase.'}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedArticles.map((article) => (
              <article
                key={article.id || article.title}
                onClick={() => setSelectedArticle(article)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-primary"
              >
                <div className="relative aspect-[1080/1350] overflow-hidden bg-paper">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
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
        )}
      </div>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </section>
  );
}
