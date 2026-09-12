import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Share2, BookOpen } from 'lucide-react';
import { Article } from '../services/api';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
}

export default function ArticleModal({ article, onClose }: ArticleModalProps) {
  if (!article) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan artikel disalin ke papan klip!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl z-10 my-8 text-black"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-lg backdrop-blur-xs transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Hero Image */}
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-block mb-3 shadow-md">
                  {article.category}
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
                  {article.title}
                </h2>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="px-6 sm:px-10 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-black/60">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> {article.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> {article.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {article.read_time}
                </span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Bagikan
              </button>
            </div>

            {/* Article Content */}
            <div className="p-6 sm:p-10">
              <p className="text-base sm:text-lg font-medium text-black/80 leading-relaxed mb-6 italic border-l-4 border-primary pl-4">
                "{article.description}"
              </p>

              <div className="prose prose-slate max-w-none text-black/75 leading-relaxed space-y-4 text-sm sm:text-base">
                {article.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black">Pusat Riset Salimna</div>
                    <div className="text-[11px] text-black/40">Diterbitkan secara digital di Salimna Platform</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-md"
                >
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
