import { useEffect, useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, Product } from '../services/api';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>(() => api.getCachedProducts());
  const [loading, setLoading] = useState(() => api.getCachedProducts().length === 0);

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

  return (
    <section id="toko" className="pb-12 md:pb-14">
      <div className="wrap">
        <div className="section-head">
          <h2>Our Products</h2>
          <Link to="/shop">Katalog lengkap →</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[14px] border border-line bg-paper px-6 py-14 text-center">
            <p className="font-display text-lg font-extrabold text-ink">Belum ada produk di katalog.</p>
            <p className="mt-1 text-sm text-muted">
              Produk yang ditambahkan lewat admin akan tampil di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => {
              const imageSrc = product.images?.[0];
              return (
                <article key={product.id} className="group">
                  <Link to="/shop" className="block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] border border-line bg-paper">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-muted">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                      {product.badge && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-sm">
                          {product.badge}
                        </span>
                      )}
                      {product.stock <= 0 && (
                        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Habis
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="mt-2.5">
                    <div className="text-[12.5px] text-muted">{product.category}</div>
                    <h3 className="mt-0.5 text-[15px] font-medium leading-snug text-ink">{product.name}</h3>
                    <div className="mt-1 text-[15px] font-bold text-ink">{product.price_formatted}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {product.stock > 0 ? `Stok ${product.stock} tersedia` : 'Stok habis'}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
