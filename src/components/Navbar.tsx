import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingBag, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import BrandLogo from './BrandLogo';

const INSTAGRAM = 'https://instagram.com/salimna_official';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { totalCount, setIsCartOpen } = useCart();

  const isHomePage = location.pathname === '/';
  const isShopPage = location.pathname === '/shop';
  const isArticlesPage = location.pathname === '/artikel' || location.pathname === '/articles';
  const isAdminPage = location.pathname === '/admin';

  const navLinks = [
    { name: 'Beranda', href: '#home', id: 'home' },
    { name: 'Artikel', href: '/artikel', id: 'artikel' },
    { name: 'Toko', href: '/shop', id: 'shop' },
  ];

  useEffect(() => {
    if (isAdminPage) {
      setActiveSection('admin');
      return;
    }
    if (isShopPage) {
      setActiveSection('shop');
      return;
    }
    if (isArticlesPage) {
      setActiveSection('artikel');
      return;
    }

    const handleScroll = () => {
      if (!isHomePage) return;

      const scrollPosition = window.scrollY + 140;

      if (scrollPosition < 420) {
        setActiveSection('home');
        return;
      }

      const sections = ['tulisan', 'toko'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section === 'tulisan' ? 'artikel' : section);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, isShopPage, isArticlesPage, isAdminPage]);

  const goToSection = (hash: string) => {
    if (!isHomePage) {
      navigate('/' + hash);
      return;
    }
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);

    if (href.startsWith('#')) {
      if (href === '#home') {
        if (!isHomePage) navigate('/');
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      goToSection(href);
      return;
    }

    navigate(href);
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink px-4 py-2 text-center text-[13px] text-white">
        Memahami zaman. Menjaga nilai.{' '}
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-semibold text-sun underline underline-offset-4 hover:text-white"
        >
          Ikuti @salimna_official
        </a>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-white">
        <div className="wrap flex h-[68px] items-center justify-between gap-4">
          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              setIsOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 font-display text-[22px] font-extrabold tracking-tight text-ink"
            aria-label="Salimna"
          >
            <BrandLogo className="h-8 w-8" />
            Salimna
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-[15px] font-medium md:flex" aria-label="Menu utama">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNav(e, link.href)}
                className={`border-b-2 py-1.5 transition-colors ${
                  activeSection === link.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink hover:border-primary hover:text-primary'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Tools */}
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/artikel');
              }}
              aria-label="Cari tulisan"
              className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Keranjang belanja"
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-line bg-white md:hidden"
            >
              <nav className="wrap flex flex-col py-3">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNav(e, link.href)}
                    className={`border-b border-line/60 py-3 text-[15px] font-medium ${
                      activeSection === link.id ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white"
                >
                  <ShoppingBag className="h-4 w-4" /> Keranjang ({totalCount})
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
