import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { openScope } from './ScopeDialog';

interface SlideCta {
  label: string;
  href: string;
  variant: 'primary' | 'ghost';
  scope?: boolean;
}

interface Slide {
  title: string;
  desc: string;
  ctas: SlideCta[];
  bg: string;
}

const slides: Slide[] = [
  {
    title: 'Berpikir jernih, bertindak bijak',
    desc: 'Media dan komunitas yang menanggapi fenomena sosial, lingkungan hidup, dan praktik keagamaan — tanpa kehilangan akar nilai.',
    ctas: [
      { label: 'Jelajahi tulisan', href: '#tulisan', variant: 'primary' },
      { label: 'Kunjungi toko', href: '/shop', variant: 'ghost' },
    ],
    bg: 'radial-gradient(circle at 80% 30%, #0295b0 0, transparent 48%), radial-gradient(circle at 70% 90%, rgba(224,168,46,0.32) 0, transparent 42%), #1c2340',
  },
  {
    title: 'Memahami zaman. Menjaga nilai.',
    desc: 'Tiga ruang diskusi untuk anak muda: sosial, lingkungan, dan Islam — dibaca dengan jernih, ditanggapi dengan bijak.',
    ctas: [{ label: 'Lihat lingkup pembahasan', href: '#lingkup', variant: 'primary', scope: true }],
    bg: 'radial-gradient(circle at 85% 40%, #b5483f 0, transparent 48%), #2a1a24',
  },
  {
    title: 'Pakaian dengan pesan yang bermakna',
    desc: 'Bawa gagasan Salimna dalam keseharian lewat koleksi Rēvēlatiōn — busana yang berbicara tanpa harus berteriak.',
    ctas: [{ label: 'Jelajahi katalog', href: '/shop', variant: 'primary' }],
    bg: 'radial-gradient(circle at 80% 50%, #e0a82e 0, transparent 45%), #1d3a33',
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>(() => {
    const cached = api.getCachedSettings();
    return [
      cached.hero_image_1 || cached.hero_image || '',
      cached.hero_image_2 || '',
      cached.hero_image_3 || '',
    ];
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadSettings = () => {
      api
        .getSettings()
        .then((settings) => {
          if (!isMounted) return;
          setHeroImages([
            settings.hero_image_1 || settings.hero_image || '',
            settings.hero_image_2 || '',
            settings.hero_image_3 || '',
          ]);
        })
        .catch((error) => {
          console.warn('Gagal memuat pengaturan hero dari Supabase:', error.message);
        });
    };

    loadSettings();
    window.addEventListener('salimna:hero-updated', loadSettings);

    return () => {
      isMounted = false;
      window.removeEventListener('salimna:hero-updated', loadSettings);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  const handleCta = (cta: SlideCta) => {
    if (cta.scope) {
      openScope();
      return;
    }
    if (cta.href.startsWith('#')) {
      document.querySelector(cta.href)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(cta.href);
  };

  return (
    <section
      className="relative overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="Sorotan Salimna"
    >
      <div
        className="relative z-10 flex h-[clamp(340px,42vw,470px)] transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const background = heroImages[i];
          return (
            <div
              key={slide.title}
              className="relative flex min-w-full items-center text-white"
              style={{ background: background ? 'transparent' : slide.bg }}
              aria-hidden={i !== index}
            >
              {background && (
                <>
                  <img
                    src={background}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => {
                      setHeroImages((prev) => {
                        const next = [...prev];
                        next[i] = '';
                        return next;
                      });
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-ink/40" />
                </>
              )}
              {/* Decorative ring */}
            <div
              className="pointer-events-none absolute right-[5%] top-1/2 hidden aspect-square w-[min(34vw,360px)] -translate-y-1/2 rounded-full border border-white/25 sm:block"
              style={{ boxShadow: 'inset 0 0 0 40px rgba(255,255,255,.04), inset 0 0 0 90px rgba(255,255,255,.04)' }}
            />
            <div className="wrap relative z-10">
              <h1 className="max-w-[640px] font-display text-[clamp(30px,5vw,58px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
                {slide.title}
              </h1>
              <p className="mt-3.5 max-w-[480px] text-[clamp(14px,1.6vw,17px)] text-white/85 md:mt-4">
                {slide.desc}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
                {slide.ctas.map((cta) => (
                  <button
                    key={cta.label}
                    type="button"
                    onClick={() => handleCta(cta)}
                    className={
                      cta.variant === 'primary'
                        ? 'inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark'
                        : 'inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-ink'
                    }
                  >
                    {cta.label}
                  </button>
                ))}
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Slide sebelumnya"
        className="absolute left-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Slide berikutnya"
        className="absolute right-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
