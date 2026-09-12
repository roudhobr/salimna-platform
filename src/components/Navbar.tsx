import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Menu, X, ShoppingBag, Database } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { totalCount, setIsCartOpen } = useCart();

  const isHomePage = location.pathname === '/';
  const isShopPage = location.pathname === '/shop';
  const isAboutPage = location.pathname === '/about';
  const isAdminPage = location.pathname === '/admin';

  const navLinks = [
    { name: 'Beranda', href: '#home', id: 'home' },
    { name: 'Tentang Kami', href: '/about', id: 'about' },
    { name: 'Artikel', href: '#research', id: 'research' },
    { name: 'Toko', href: '/shop', id: 'shop' },
    { name: 'Admin', href: '/admin', id: 'admin' },
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
    if (isAboutPage) {
      setActiveSection('about');
      return;
    }

    const handleScroll = () => {
      if (!isHomePage) return;

      const scrollPosition = window.scrollY + 100;

      if (scrollPosition < 500) {
        setActiveSection('home');
        return;
      }

      const sections = ['research', 'shop'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, isShopPage, isAboutPage, isAdminPage]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setIsOpen(false);
      
      if (href === '#home') {
        if (!isHomePage) {
          navigate('/');
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (!isHomePage) {
        navigate('/' + href);
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      e.preventDefault();
      setIsOpen(false);
      navigate(href);
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-12 flex justify-center"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-blue-100 rounded-full py-2.5 px-5 md:py-3 md:px-8 flex items-center justify-between gap-4 md:gap-8 text-dark shadow-xl w-full max-w-3xl">
          <Link 
            to="/" 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="bg-primary p-1.5 rounded-full shadow-md">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-dark italic">Salimna</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="relative group py-1"
              >
                <span className={`text-sm font-medium transition-colors ${activeSection === link.id ? 'text-primary font-bold' : 'text-dark/70 hover:text-primary'}`}>
                  {link.name}
                </span>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-primary transition-all duration-300 ${activeSection === link.id ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'}`} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Button with Count Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-primary/5 hover:bg-primary/10 text-primary p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-primary"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-24 z-40 px-6 md:hidden"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-blue-50 rounded-[30px] p-6 shadow-2xl flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  className={`text-lg font-bold italic py-2 border-b border-blue-50/50 transition-colors ${activeSection === link.id ? 'text-primary' : 'text-dark/70'}`}
                >
                  {link.name}
                </a>
              ))}
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsCartOpen(true);
                }}
                className="mt-2 bg-primary text-white py-3.5 rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Keranjang ({totalCount})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
