import { motion } from 'motion/react';
import { ArrowUpRight, Globe } from 'lucide-react';

export default function Hero() {
  const handleScroll = (id: string) => {
    const target = document.querySelector(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVision = () => {
    alert("Visi Salimna: Menjadi cahaya utama dalam eksplorasi digital akan kebenaran.");
  };

  return (
    <section className="relative pt-32 pb-8 px-6 sm:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Top Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-white p-1.5 rounded-full transform -rotate-12 shadow-blue-500/20 shadow-xl">
               <div className="bg-primary p-1.5 rounded-full">
                  <Globe className="w-5 h-5 text-black" />
               </div>
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl leading-[1.1] text-dark">
            Menjelajahi <br /> <span className="text-primary italic">Fenomena</span> Salimna
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex flex-col items-start max-w-xs text-left">
              <div className="text-primary mb-2">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <p className="text-dark/60 text-xs md:text-sm leading-relaxed">
                Platform digital yang berdedikasi untuk mengungkap kebenaran di balik gerakan sosial, alam, dan agama.
              </p>
              <button 
                onClick={handleVision}
                className="mt-4 border-b border-primary text-primary text-sm font-medium pb-1 tracking-wider uppercase hover:text-dark hover:border-dark transition-all"
              >
                Temukan Visi Kami
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[60px] p-4 overflow-hidden w-full max-w-[400px] flex items-center justify-center border-4 border-blue-50 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" 
                  alt="Fenomena Salimna" 
                  className="w-full h-auto rounded-[40px] transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Floating Experience Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute top-10 -right-12 bg-white text-black p-4 rounded-3xl shadow-2xl z-10 hidden lg:block"
              >
                <div className="flex gap-1 mb-2">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="font-display font-bold text-2xl">Platform</div>
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Digital</div>
              </motion.div>

              {/* Floating CTA Buttons */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 whitespace-nowrap z-20">
                <button 
                onClick={() => handleScroll('#research')}
                className="bg-primary text-white border border-primary px-8 py-4 rounded-full font-bold text-sm hover:bg-white hover:text-primary transition-all flex items-center gap-2 shadow-lg"
                >
                  Jelajahi Artikel
                </button>
                <button 
                onClick={() => handleScroll('#shop')}
                className="bg-white text-primary px-8 py-4 rounded-full font-bold text-sm border border-primary hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  Kunjungi Toko
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
