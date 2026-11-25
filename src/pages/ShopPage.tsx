import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ShoppingBag, X, ChevronLeft, ChevronRight, Maximize2, Loader2 } from 'lucide-react';
import { api, Product } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ShopPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(() => api.getCachedProducts());
  const [loading, setLoading] = useState(() => api.getCachedProducts().length === 0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedSize, setSelectedSize] = useState('L');

  useEffect(() => {
    let isMounted = true;
    api
      .getProducts()
      .then((data) => {
        if (isMounted) setProducts(data || []);
      })
      .catch((err) => {
        console.warn('Gagal memuat katalog dari Supabase:', err.message);
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
    const images = Array.isArray(product.images) ? product.images : [];
    setSelectedProduct(product);
    setCurrentImageIndex(images.length ? Math.min(index, images.length - 1) : 0);
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
    const count = selectedProduct?.images?.length || 0;
    if (count < 2) return;
    setCurrentImageIndex((prev) => (prev + 1) % count);
  };

  const prevImage = () => {
    const count = selectedProduct?.images?.length || 0;
    if (count < 2) return;
    setCurrentImageIndex((prev) => (prev - 1 + count) % count);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, selectedSize);
    if (selectedProduct) {
      closeLightbox();
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink selection:bg-primary selection:text-white">
      <main className="pt-10 pb-16 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-ink">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-3"
              >
                Katalog <span className="text-primary italic">Salimna</span>
              </motion.h1>
              <p className="text-muted max-w-md text-sm">
                Busana yang membawa gagasan Salimna ke keseharian — dibuat terbatas, dimaknai seluas-luasnya.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Semua', 'Pakaian', 'Aksesori', 'Terbatas'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveFilter(cat)}
                  className={`px-5 py-2 rounded-full border text-xs font-bold transition-all shadow-sm cursor-pointer ${activeFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white text-ink border-line hover:border-primary/50'}`}
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
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-paper px-6 py-16 text-center">
              <p className="font-display text-lg font-extrabold text-ink">
                {products.length === 0 ? 'Belum ada produk di katalog.' : 'Tidak ada produk di kategori ini.'}
              </p>
              <p className="mt-1 text-sm text-muted">
                Produk yang ditambahkan lewat admin akan tampil di sini.
              </p>
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
                  <div className="relative aspect-[4/5] rounded-[10px] overflow-hidden bg-paper border border-line mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                    )}
                    
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-primary text-white text-[8px] md:text-[10px] font-black uppercase px-2 py-1 md:px-3 md:py-1.5 rounded-full z-10 shadow-lg">
                        {product.badge}
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute bottom-3 left-3 bg-ink/75 text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-full z-10">
                        Habis
                      </div>
                    )}

                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openLightbox(product, 0); }}
                        className="bg-white text-ink p-3 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl"
                        title="Detail & Zoom"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        disabled={product.stock <= 0}
                        className="bg-white text-ink p-3 rounded-full hover:bg-primary hover:text-white transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted text-[9px] font-bold uppercase tracking-widest italic">{product.category}</span>
                    </div>
                    <h4 className="text-sm font-bold text-ink group-hover:text-primary transition-colors mb-0.5 italic truncate">{product.name}</h4>
                    <div className="text-primary font-display font-bold text-sm">{product.price_formatted}</div>
                    <div className={`text-[10px] mt-1 ${product.stock > 0 ? 'text-muted' : 'text-red-600 font-semibold'}`}>
                      {product.stock > 0 ? `Stok ${product.stock} tersedia` : 'Stok habis'}
                    </div>
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
              className="absolute top-8 right-8 text-muted hover:text-primary transition-colors z-20 cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full max-w-6xl flex flex-col md:flex-row gap-8 items-center overflow-hidden">
              {/* Image Gallery Side */}
              <div className="relative flex-1 w-full h-[50vh] md:h-full flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={toggleZoom}>
                <AnimatePresence mode="wait">
                  {selectedProduct.images?.length > 0 ? (
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
                      className="max-w-full max-h-full object-contain rounded-[10px] shadow-xl transition-all duration-300"
                      referrerPolicy="no-referrer"
                      style={{ cursor: zoomScale > 1 ? 'grab' : 'zoom-in' }}
                    />
                  ) : (
                    <div key="placeholder" className="grid h-full w-full place-items-center text-muted">
                      <ShoppingBag className="h-16 w-16" />
                    </div>
                  )}
                </AnimatePresence>

                {selectedProduct.images?.length > 1 && zoomScale === 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 border border-line text-primary hover:bg-primary hover:text-white transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 border border-line text-primary hover:bg-primary hover:text-white transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Thumbnail Indicators */}
                {zoomScale === 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedProduct.images?.map((_: any, idx: number) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-primary' : 'bg-ink/20'}`}
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
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight text-ink italic">
                  {selectedProduct.name}
                </h2>
                <div className="text-2xl font-bold text-primary mb-4">
                  {selectedProduct.price_formatted}
                </div>
                <p className={`text-xs font-semibold mb-4 ${selectedProduct.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {selectedProduct.stock > 0 ? `Stok tersedia: ${selectedProduct.stock}` : 'Stok habis'}
                </p>
                <p className="text-muted text-xs md:text-sm leading-relaxed mb-6 border-l-2 border-primary pl-4">
                  {selectedProduct.description}
                </p>

                {/* Size Selector */}
                {selectedProduct.category !== 'Aksesori' && (
                  <div className="mb-6">
                    <div className="text-xs font-bold text-ink mb-2 uppercase tracking-wider">Pilih Ukuran:</div>
                    <div className="flex gap-2">
                      {['S', 'M', 'L', 'XL'].map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-10 rounded-[10px] font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-primary text-white shadow-md'
                              : 'border border-line text-ink hover:border-primary'
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
                    disabled={selectedProduct.stock <= 0}
                    className="w-full bg-primary text-white py-4 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" /> {selectedProduct.stock > 0 ? 'Masukkan ke Keranjang' : 'Stok Habis'}
                  </button>
                  <p className="text-[10px] text-center text-muted italic">Klik gambar untuk Zoom & Geser</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
