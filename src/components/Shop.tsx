import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, Product } from '../services/api';
import { useCart } from '../context/CartContext';

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Revelation Shirt',
    slug: 'revelation-shirt',
    price: 249000,
    price_formatted: 'Rp 249.000',
    category: 'Salimna Cloth',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'],
    badge: 'Terlaris',
    description: 'Baju lengan panjang katun premium kelas berat.',
    buy_link: 'https://wa.me/6282131653815',
    stock: 25,
    is_active: 1
  },
  {
    id: 2,
    name: 'Tee Light Over Darkness',
    slug: 'tee-light-over-darkness',
    price: 199000,
    price_formatted: 'Rp 199.000',
    category: 'Edisi Terbatas',
    images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop'],
    badge: 'Baru',
    description: 'Kaos katun combed 24s dengan sablon simbolis.',
    buy_link: 'https://wa.me/6282131653815',
    stock: 30,
    is_active: 1
  },
  {
    id: 3,
    name: 'Hoodie Filosofi',
    slug: 'hoodie-filosofi',
    price: 399000,
    price_formatted: 'Rp 399.000',
    category: 'Esensial',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'],
    badge: 'Eksklusif',
    description: 'Hoodie hitam oversized 330 GSM dengan logo Salimna.',
    buy_link: 'https://wa.me/6282131653815',
    stock: 15,
    is_active: 1
  },
  {
    id: 4,
    name: 'Totebag Salimna',
    slug: 'totebag-salimna',
    price: 89000,
    price_formatted: 'Rp 89.000',
    category: 'Aksesori',
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'],
    badge: '',
    description: 'Totebag kanvas tebal ramah lingkungan.',
    buy_link: 'https://wa.me/6282131653815',
    stock: 40,
    is_active: 1
  }
];

export default function Shop() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    api.getProducts()
      .then(data => {
        if (isMounted && data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(err => {
        console.warn('Menggunakan fallback katalog:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleShop = () => {
    navigate('/shop');
  };

  const handleScrollClick = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section id="shop" className="px-6 sm:px-12 py-10 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Combined Shop Hero Card */}
        <div className="bg-primary/5 rounded-[30px] md:rounded-[50px] p-5 md:p-10 border border-blue-100 flex flex-col lg:flex-row items-center gap-8 md:gap-10 overflow-hidden relative shadow-xl mb-10">
          <div className="flex-1 z-10 w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-display text-lg md:text-2xl font-bold tracking-tight text-black flex items-center gap-2">
                Pakaian <span className="bg-primary text-white text-[10px] md:text-sm px-2.5 py-0.5 rounded-full font-bold italic shadow-sm">Salimna</span>
              </h2>
            </div>
            
            <h3 className="font-display text-base md:text-lg font-bold mb-2 text-black italic">
              Seri "Rëvëlatiön"
            </h3>
            
            <p className="text-black/60 text-[10px] md:text-xs max-w-xs mb-4 leading-relaxed">
              Ekspresikan perjalanan penemuan Anda melalui pakaian eksklusif kami dengan nilai filosofis mendalam.
            </p>

            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleShop}
                className="bg-primary text-white border border-primary px-4 py-2 rounded-full font-bold text-[9px] md:text-[11px] hover:bg-white hover:text-primary transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                Katalog Lengkap <ShoppingBag className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 relative cursor-pointer group flex justify-center w-full"
            onClick={handleShop}
          >
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 bg-white p-2 rounded-[24px] border border-blue-50 shadow-lg backdrop-blur-sm w-full max-w-xs md:max-w-sm"
            >
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
                alt="Pengungkapan Pakaian Salimna" 
                className="w-full h-40 md:h-56 object-cover rounded-[16px] transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-primary/80 backdrop-blur-sm p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-primary/5 blur-[60px] rounded-full -z-10"></div>
          </div>
        </div>

        {/* Product Slider */}
        <div className="relative group">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => {
              const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop';
              return (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex-none w-[200px] md:w-[280px] snap-start group/card cursor-pointer"
                >
                  <div 
                    onClick={handleShop}
                    className="relative aspect-[4/5] rounded-[16px] md:rounded-[20px] overflow-hidden bg-primary/5 border border-blue-50 mb-2 md:mb-3 shadow-sm group-hover/card:shadow-md transition-shadow"
                  >
                    <img 
                      src={imageSrc} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {product.badge && (
                      <div className="absolute top-2 left-2 bg-primary text-white text-[7px] md:text-[9px] font-black uppercase px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm">
                        {product.badge}
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="absolute bottom-3 right-3 bg-white hover:bg-primary text-black hover:text-white p-2.5 rounded-full shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-y-0"
                      title="Tambah ke Keranjang"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-1" onClick={handleShop}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-black/40 text-[7px] md:text-[9px] font-bold uppercase tracking-widest italic">{product.category}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-2 md:w-2.5 md:h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[7px] md:text-[9px] text-black/60 font-bold">5.0</span>
                      </div>
                    </div>
                    <h4 className="text-[10px] md:text-xs font-bold text-black group-hover/card:text-primary transition-colors mb-0 italic truncate">{product.name}</h4>
                    <div className="text-primary font-display font-bold text-[10px] md:text-sm">{product.price_formatted}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={() => handleScrollClick('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 md:p-3 rounded-full bg-white border border-blue-50 text-primary shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center z-10 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => handleScrollClick('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 md:p-3 rounded-full bg-white border border-blue-50 text-primary shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center z-10 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
