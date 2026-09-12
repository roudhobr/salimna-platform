import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, ArrowRight, Loader2 } from 'lucide-react';
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
    is_published: 1
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
    is_published: 1
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
    is_published: 1
  }
];

export default function Research() {
  const [articles, setArticles] = useState<Article[]>(fallbackArticles);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getArticles()
      .then(data => {
        if (isMounted && data && data.length > 0) {
          setArticles(data);
        }
      })
      .catch(err => {
        console.warn('Menggunakan data riset lokal:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedArticles = showAll ? articles : articles.slice(0, 3);

  return (
    <section id="research" className="px-6 sm:px-12 py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-dark">Riset</h2>
            <div className="bg-primary text-white px-6 py-3 rounded-full font-display text-xl md:text-3xl font-bold italic shadow-lg">
              Terbaru
            </div>
          </div>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-primary hover:text-dark transition-colors text-xs font-bold flex items-center gap-2 group cursor-pointer"
          >
            {showAll ? 'TAMPILKAN LEBIH SEDIKIT' : 'LIHAT SEMUA RISET'} 
            <ArrowRight className={`w-3 h-3 group-hover:translate-x-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedArticles.map((article, index) => (
              <motion.div 
                key={article.id || article.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-[40px] overflow-hidden border border-blue-50 shadow-md hover:shadow-xl hover:border-primary/30 transition-all flex flex-col h-full group cursor-pointer"
              >
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                    {article.category}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-dark/30 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </div>
                  <h3 className="font-display text-xl font-bold text-dark mb-4 leading-tight group-hover:text-primary transition-colors italic">
                    {article.title}
                  </h3>
                  <p className="text-dark/40 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center gap-2 text-xs font-bold text-primary group-hover:text-dark transition-colors uppercase tracking-widest">
                      Baca Riset <BookOpen className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] text-black/40">{article.read_time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Article Full View Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </section>
  );
}
