import { useEffect, useRef } from 'react';
import { X, Users, Leaf, Moon, ArrowUpRight } from 'lucide-react';

const OPEN_EVENT = 'salimna:open-scope';
const INSTAGRAM = 'https://instagram.com/salimna_official';

export function openScope() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const pillars = [
  {
    key: 'sosial',
    title: 'Fenomena Sosial',
    icon: Users,
    color: 'var(--color-navy)',
    items: [
      ['Kelas sosial dan ketimpangan', 'seperti gengsi profesi'],
      ['Budaya pop dan media sosial', 'tren viral, FOMO, dan konsumtif'],
      ['Anak muda dan identitas', 'seperti quarter life crisis'],
      ['Relasi sosial', 'keluarga, pertemanan, dan etika bermasyarakat'],
    ],
  },
  {
    key: 'lingkungan',
    title: 'Lingkungan Hidup',
    icon: Leaf,
    color: 'var(--color-leaf)',
    items: [
      ['Krisis iklim dan perubahan cuaca', 'global warming dan dampaknya'],
      ['Konsumsi dan sampah', 'gaya hidup minim sampah atau zero waste'],
      ['Aksi nyata dan edukasi ekologis', 'eco lifestyle dan gerakan menanam pohon'],
    ],
  },
  {
    key: 'keagamaan',
    title: 'Praktik Keagamaan',
    icon: Moon,
    color: 'var(--color-rust)',
    items: [
      ['Ibadah dan relevansinya', 'zakat sebagai penguatan sosial'],
      ['Hijrah dan spiritualitas modern', 'komersialisasi hijrah'],
      ['Etika sosial dalam Islam', 'adab bermedia sosial'],
      ['Agama dan isu kemanusiaan', 'respons Islam atas kemiskinan dan ketidakadilan'],
    ],
  },
];

export default function ScopeDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const open = () => {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      dialog.scrollTop = 0;
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    window.addEventListener(OPEN_EVENT, open);
    dialog.addEventListener('click', handleBackdrop);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      dialog.removeEventListener('click', handleBackdrop);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="scope-title"
      className="m-auto max-h-[min(88vh,780px)] w-[min(960px,calc(100%-2rem))] overflow-y-auto rounded-[18px] border-0 bg-paper p-0 text-ink shadow-2xl"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper px-5 py-5 sm:px-7 sm:pt-6">
        <div>
          <h2 id="scope-title" className="font-display text-[clamp(22px,3vw,30px)] font-extrabold leading-tight tracking-[-0.02em]">
            Lingkup pembahasan
          </h2>
          <p className="mt-1.5 max-w-[560px] text-muted">
            Tiga ruang diskusi Salimna untuk memahami zaman dan menjaga nilai.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Tutup"
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-white"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-7 md:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.key} className="overflow-hidden rounded-[10px] border border-line bg-white">
              <header
                className="flex items-center gap-2.5 px-4 py-3.5 font-display text-[19px] font-extrabold text-white"
                style={{ backgroundColor: pillar.color }}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                {pillar.title}
              </header>
              <ul className="grid gap-3 p-4 text-sm text-muted">
                {pillar.items.map(([bold, rest]) => (
                  <li key={bold} className="relative pl-4">
                    <span
                      className="absolute left-0 top-[0.62em] h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <b className="font-semibold text-ink">{bold}</b>, {rest}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col items-start justify-between gap-4 px-5 pb-5 sm:flex-row sm:items-center sm:px-7 sm:pb-6">
        <span className="text-sm text-muted">Ikuti diskusinya setiap hari di Instagram.</span>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Ikuti @salimna_official <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </dialog>
  );
}
