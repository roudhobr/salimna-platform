import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Intro from './components/Intro';
import Research from './components/Research';
import Shop from './components/Shop';
import CommunityCTA from './components/CommunityCTA';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ScopeDialog from './components/ScopeDialog';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

const ShopPage = lazy(() => import('./pages/ShopPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));

function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Research />
      <Shop />
    </>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const isAdmin = pathname === '/admin';
  const isReceiptPage = pathname.startsWith('/nota/');

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {!isReceiptPage && <Navbar />}

      <div className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh]" aria-label="Memuat halaman" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/artikel" element={<ArticlesPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/nota/:token" element={<ReceiptPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
      </div>

      {!isAdmin && !isReceiptPage && <CommunityCTA />}
      {!isReceiptPage && <Footer />}
      {!isReceiptPage && <CartDrawer />}
      {!isReceiptPage && <ScopeDialog />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <Shell />
      </Router>
    </CartProvider>
  );
}
