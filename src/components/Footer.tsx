import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openScope } from './ScopeDialog';
import BrandLogo from './BrandLogo';

const INSTAGRAM = 'https://instagram.com/salimna_official';
const WHATSAPP = 'https://wa.me/6282131653815';

export default function Footer() {
  const navigate = useNavigate();

  const handleNav = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    if (target.startsWith('/#')) {
      if (window.location.pathname === '/') {
        document.querySelector(target.substring(1))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(target);
      }
      return;
    }
    navigate(target);
  };

  return (
    <footer className="border-t border-line bg-paper pt-12">
      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 font-display text-[22px] font-extrabold tracking-tight text-ink"
            >
              <BrandLogo className="h-8 w-8" />
              Salimna
            </button>
            <p className="mt-3 max-w-[320px] text-sm text-muted">
              Memahami zaman. Menjaga nilai. Media dan komunitas untuk wawasan dan keilmuan seputar
              sosial, lingkungan, dan Islam.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-md border border-ink text-ink transition hover:bg-ink hover:text-white"
              >
                <Instagram className="h-[17px] w-[17px]" />
              </a>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid h-9 w-9 place-items-center rounded-md border border-ink text-ink transition hover:bg-ink hover:text-white"
              >
                <MessageCircle className="h-[17px] w-[17px]" />
              </a>
            </div>
          </div>

          {/* Menu utama */}
          <div>
            <h4 className="mb-3 border-b border-ink pb-2 font-display text-[15px] font-bold text-ink">
              Menu utama
            </h4>
            <ul className="grid gap-2 text-sm text-muted">
              <li><a href="/" onClick={(e) => handleNav(e, '/')} className="hover:text-primary">Beranda</a></li>
              <li><a href="/artikel" onClick={(e) => handleNav(e, '/artikel')} className="hover:text-primary">Artikel</a></li>
              <li><a href="/shop" onClick={(e) => handleNav(e, '/shop')} className="hover:text-primary">Katalog Toko</a></li>
            </ul>
          </div>

          {/* Lingkup */}
          <div>
            <h4 className="mb-3 border-b border-ink pb-2 font-display text-[15px] font-bold text-ink">
              Lingkup
            </h4>
            <ul className="grid gap-2 text-sm text-muted">
              <li><button type="button" onClick={openScope} className="hover:text-primary">Fenomena Sosial</button></li>
              <li><button type="button" onClick={openScope} className="hover:text-primary">Lingkungan Hidup</button></li>
              <li><button type="button" onClick={openScope} className="hover:text-primary">Praktik Keagamaan</button></li>
            </ul>
          </div>

          {/* Hubungi */}
          <div className="md:col-span-2 lg:col-span-1">
            <h4 className="mb-3 border-b border-ink pb-2 font-display text-[15px] font-bold text-ink">
              Hubungi kami
            </h4>
            <p className="text-sm text-muted">
              Pertanyaan soal tulisan, pesanan, atau kerja sama? Kirim pesan lewat Instagram atau
              WhatsApp.
            </p>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 text-[13px] text-muted">
          <span>© 2026 Salimna. Seluruh hak dilindungi.</span>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            @salimna_official
          </a>
        </div>
      </div>
    </footer>
  );
}
