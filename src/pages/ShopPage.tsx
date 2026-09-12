import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, X, ChevronLeft, ChevronRight, Maximize2, Loader2, Check } from 'lucide-react';
import { api, Product } from '../services/api';
import { useCart } from '../context/CartContext';
// @ts-ignore
import revelationShirtImg from '../assets/images/revelation_shirt_1780580972108.png';

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Revelation Shirt',
    slug: 'revelation-shirt',
    price: 249000,
    price_formatted: 'Rp 249.000',
    category: 'Salimna Cloth',
    images: [
      revelationShirtImg,
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop'
    ],
    badge: 'Terlaris',
    description: 'Baju lengan panjang katun premium kelas berat yang memadukan keindahan seni visual, kaligrafi Arab, dan pesan filosofis "Revelation: Light Over Darkness". Setiap helai kain menyiratkan perjalanan pengungkapan makna.',
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
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523381313430-8025287ade3b?q=80&w=800&auto=format&fit=crop'
    ],
    badge: 'Baru',
    description: 'Kaos minimalis dengan sablon dada simbolis. Mencerminkan filosofi inti Salimna: mengungkap kebenaran melalui ketekunan.',
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
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'
    ],
    badge: '',
    description: 'Hoodie hitam oversized dengan logo Salimna bordir. Kain kelas berat untuk kenyamanan dan keawetan.',
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
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'
    ],
    badge: '',
    description: 'Totebag kanvas untuk bahan riset harian Anda.',
    buy_link: 'https://wa.me/6282131653815',
    stock: 40,
    is_active: 1
  }
];

export default function ShopPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedSize, setSelectedSize] = useState('L');

  useEffect(() => {
    let isMounted = true;
    api.getProducts()
      .then(data => {
        if (isMounted && data && data.length > 0) {
          // Replace fallback Revelation shirt image if needed
          const updated = data.map(p => {
            if (p.slug === 'revelation-shirt' && p.images && p.images.length > 0) {
              return {
                ...p,
                images: [revelationShirtImg, ...p.images.slice(1)]
              };
            }
            return p;
          });
          setProducts(updated);
        }
      })
      .catch(err => {
        console.warn('Menggunakan fallback katalog:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter(product => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Pakaian') return product.category === 'Salimna Cloth' || product.category === 'Esensial';
    if (activeFilter === 'Aksesori') return product.category === 'Aksesori';
    if (activeFilter === 'Terbatas') return product.category === 'Edisi Terbatas';
    return true;
  });

  const openLightbox = (product: any, index: number) => {
    setSelectedProduct(product);
    setCurrentImageIndex(index);
    setZoomScale(1);
    setSelectedSize('L');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedProduct(null);
    setZoomScale(1);
    document.body.style.overflow = 'auto';
  };

  const toggleZoom = () => {
    setZoomScale(prev => prev === 1 ? 1.5 : 1);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, selectedSize);
    if (selectedProduct) {
      closeLightbox();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-primary selection:text-white">
      <main className="pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-black">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-3"
              >
                Katalog <span className="text-primary italic">Shop</span>
              </motion.h1>
              <p className="text-black/60 max-w-md text-sm">
                Koleksi pakaian eksklusif yang terinspirasi oleh riset dan penemuan filosofis kami.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Semua', 'Pakaian', 'Aksesori', 'Terbatas'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveFilter(cat)}
                  className={`px-5 py-2 rounded-full border text-xs font-bold transition-all shadow-sm cursor-pointer ${activeFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white text-black border-blue-50 hover:border-primary/50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20 text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {filteredProducts.map((product, index) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(product, 0)}
                >
                  <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-primary/5 border border-blue-50 mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-primary text-white text-[8px] md:text-[10px] font-black uppercase px-2 py-1 md:px-3 md:py-1.5 rounded-full z-10 shadow-lg">
                        {product.badge}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openLightbox(product, 0); }}
                        className="bg-white text-black p-3 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
                        title="Detail & Zoom"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="bg-white text-black p-3 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-black/30 text-[9px] font-bold uppercase tracking-widest italic">{product.category}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[9px] text-black/60 font-bold">5.0</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-black group-hover:text-primary transition-colors mb-0.5 italic truncate">{product.name}</h4>
                    <div className="text-primary font-display font-bold text-sm">{product.price_formatted}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox / Zoom Portal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-8 right-8 text-black/50 hover:text-primary transition-colors z-20 cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full max-w-6xl flex flex-col md:flex-row gap-8 items-center overflow-hidden">
              {/* Image Gallery Side */}
              <div className="relative flex-1 w-full h-[50vh] md:h-full flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={toggleZoom}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    drag={zoomScale > 1}
                    dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                    dragElastic={0.1}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: zoomScale,
                      x: zoomScale > 1 ? undefined : 0,
                      y: zoomScale > 1 ? undefined : 0
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    src={selectedProduct.images[currentImageIndex]}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-xl transition-all duration-300"
                    referrerPolicy="no-referrer"
                    style={{ cursor: zoomScale > 1 ? 'grab' : 'zoom-in' }}
                  />
                </AnimatePresence>

                {selectedProduct.images.length > 1 && zoomScale === 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 border border-blue-50 text-primary hover:bg-primary hover:text-white transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 border border-blue-50 text-primary hover:bg-primary hover:text-white transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Thumbnail Indicators */}
                {zoomScale === 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedProduct.images.map((_: any, idx: number) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-primary' : 'bg-black/20'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info Side */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 w-full md:w-[380px] text-left p-4 md:p-0"
              >
                <div className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2 italic">
                  {selectedProduct.category}
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight text-black italic">
                  {selectedProduct.name}
                </h2>
                <div className="text-2xl font-bold text-primary mb-4">
                  {selectedProduct.price_formatted}
                </div>
                <p className="text-black/60 text-xs md:text-sm leading-relaxed mb-6 border-l-2 border-primary pl-4">
                  {selectedProduct.description}
                </p>

                {/* Size Selector */}
                {selectedProduct.category !== 'Aksesori' && (
                  <div className="mb-6">
                    <div className="text-xs font-bold text-black mb-2 uppercase tracking-wider">Pilih Ukuran:</div>
                    <div className="flex gap-2">
                      {['S', 'M', 'L', 'XL'].map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-primary text-white shadow-md'
                              : 'border border-gray-200 text-black hover:border-primary'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <button 
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> Masukkan ke Keranjang
                  </button>
                  <p className="text-[10px] text-center text-black/40 italic">Klik gambar untuk Zoom & Geser</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
