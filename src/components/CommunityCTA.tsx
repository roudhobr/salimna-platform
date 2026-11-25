import { ArrowUpRight } from 'lucide-react';

const INSTAGRAM = 'https://instagram.com/salimna_official';

export default function CommunityCTA() {
  return (
    <div className="wrap pb-12 md:pb-14">
      <section className="flex flex-col items-start justify-between gap-6 rounded-[14px] bg-primary px-6 py-7 text-white sm:px-8 md:flex-row md:items-center md:px-9">
        <div>
          <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] md:text-[26px]">
            Gabung dan ikuti diskusinya
          </h2>
          <p className="mt-1 text-white/88">
            Ikuti Salimna di Instagram untuk tulisan, visual, dan diskusi terbaru.
          </p>
          <div className="mt-2 text-[13px] opacity-85">@salimna_official</div>
        </div>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-sun hover:text-ink"
        >
          Ikuti di Instagram <ArrowUpRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}
