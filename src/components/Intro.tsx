import { openScope } from './ScopeDialog';

export default function Intro() {
  return (
    <section id="tentang" className="py-12 md:py-16">
      <div className="wrap">
        <blockquote className="mx-auto max-w-[820px] border-l-[3px] border-primary pl-5 sm:pl-6">
          <p className="font-display text-[clamp(20px,2.4vw,26px)] font-medium leading-[1.45] text-ink">
            Salimna adalah media dan komunitas yang berkontribusi untuk wawasan dan keilmuan,
            menanggapi fenomena sosial, lingkungan hidup, dan praktik keagamaan.
          </p>
          <p className="mt-3.5 text-[15px] text-muted">
            Tujuan kami sederhana: mencerahkan pikiran dan menguatkan iman — lewat tulisan, visual,
            dan diskusi yang dekat dengan keseharian anak muda.
          </p>
          <button
            type="button"
            onClick={openScope}
            className="mt-4 inline-block border-b-[1.5px] border-primary font-semibold text-primary transition hover:text-primary-dark"
          >
            Lihat lingkup pembahasan
          </button>
        </blockquote>
      </div>
    </section>
  );
}
