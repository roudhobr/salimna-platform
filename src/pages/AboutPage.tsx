import React from 'react';
import { motion } from 'motion/react';
import { Compass, Users, Target, BookOpen, Star } from 'lucide-react';

export default function AboutPage() {
  const images = [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop"
  ];

  return (
    <div className="pt-40 pb-24 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-8 text-black">
            Tentang <span className="text-primary italic">Salimna</span>
          </h1>
          
          <div className="space-y-6 text-black/70 leading-relaxed text-lg mb-20 italic">
            <p>
              Salimna adalah sebuah kolektif riset dan desain yang berdedikasi untuk menggali nilai-nilai filosofis dan menerjemahkannya ke dalam bentuk fisik. Kami percaya bahwa setiap benda yang kita kenakan atau gunakan harus membawa pesan yang lebih dalam.
            </p>
            <p>
              Perjalanan kami dimulai dari keinginan sederhana untuk menghubungkan kearifan masa lalu dengan dinamika masa kini. Melalui "Rëvëlatiön", kami berusaha menghadirkan pencerahan kecil dalam kehidupan sehari-hari setiap individu yang menjadi bagian dari perjalanan kami.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-blue-50"
            >
              <img 
                src={img} 
                alt={`Salimna Story ${i + 1}`} 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
