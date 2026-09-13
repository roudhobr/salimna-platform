import React from 'react';
import { motion } from 'motion/react';
import { Send, Instagram, Twitter, Youtube, Facebook, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  const handleSocialClick = (platform: string) => {
    alert(`Mengarahkan ke Salimna di ${platform}...`);
  };

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    const linkMap: Record<string, string> = {
      'Beranda': '/',
      'Tentang Kami': '/about',
      'Artikel': '/#research',
      'Katalog Toko': '/shop',
      'Admin Dashboard': '/admin',
    };

    if (linkMap[link]) {
      e.preventDefault();
      const target = linkMap[link];
      if (target.startsWith('/#')) {
        if (window.location.pathname === '/') {
          document.querySelector(target.substring(1))?.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate(target);
        }
      } else {
        navigate(target);
      }
    }
  };

  const footerLinks = [
    { title: 'Menu Utama', links: ['Beranda', 'Tentang Kami', 'Artikel', 'Katalog Toko'] },
  ];

  return (
    <footer className="px-6 sm:px-12 pt-12 pb-12 bg-white overflow-hidden relative">
      {/* Contact CTA Section */}
      <div className="max-w-4xl mx-auto mb-16 text-center">
        <div className="bg-primary rounded-[30px] p-6 md:p-10 flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 w-full max-w-sm text-white">
             <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight mb-2 italic">
                Gabung Komunitas
             </h2>
             <p className="text-white/70 text-xs md:text-sm mb-6 font-medium">
                Dapatkan info terbaru dari Salimna langsung melalui komunitas kami.
             </p>
             
             <a 
               href="https://wa.me/6282131653815"
               target="_blank"
               rel="noopener noreferrer"
               className="w-full bg-white text-primary py-3 px-8 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-md"
             >
                Gabung Sekarang <Send className="w-4 h-4" />
             </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto border-t border-blue-50 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
               <div className="bg-primary p-1.5 rounded-full shadow-lg">
                  <Compass className="w-4 h-4 text-white" />
               </div>
               <span className="font-display font-bold text-2xl tracking-tight text-dark">Salimna</span>
            </div>
            <p className="text-dark/40 text-sm max-w-xs leading-relaxed italic">
               Menjelajahi fenomena kehidupan melalui kacamata sosial, alam, dan agama.
            </p>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-sm uppercase tracking-widest mb-6 opacity-60 text-dark italic">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map(link => (
                  <li key={link}>
                    <a 
                      href="#" 
                      onClick={(e) => handleLinkClick(e, link)}
                      className="text-dark/40 hover:text-primary text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-blue-50">
          <div className="text-[10px] text-dark/20 uppercase font-bold tracking-widest">
            Hak Cipta © 2026 Salimna. Seluruh Hak Dilindungi.
          </div>
          <div className="flex items-center gap-6">
            <Instagram onClick={() => handleSocialClick('Instagram')} className="w-5 h-5 text-dark/40 hover:text-primary cursor-pointer transition-colors" />
            <Twitter onClick={() => handleSocialClick('Twitter')} className="w-5 h-5 text-dark/40 hover:text-primary cursor-pointer transition-colors" />
            <Youtube onClick={() => handleSocialClick('Youtube')} className="w-5 h-5 text-dark/40 hover:text-primary cursor-pointer transition-colors" />
            <Facebook onClick={() => handleSocialClick('Facebook')} className="w-5 h-5 text-dark/40 hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}
