import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Research from './components/Research';
import Shop from './components/Shop';
import Footer from './components/Footer';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

function HomePage() {
  return (
    <main>
      <Hero />
      <Research />
      <Shop />
    </main>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-white selection:bg-primary selection:text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <Footer />
          <CartDrawer />

          {/* Decorative Background Elements */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full"></div>
          </div>
        </div>
      </Router>
    </CartProvider>
  );
}
