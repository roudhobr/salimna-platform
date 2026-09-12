import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  price_formatted: string;
  image: string;
  qty: number;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, size?: string) => void;
  removeFromCart: (id: number, size: string) => void;
  updateQuantity: (id: number, size: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('salimna_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('salimna_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const addToCart = (product: any, size: string = 'L') => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.size === size);
      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (product.image || '');
      const priceNum = typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: priceNum,
          price_formatted: product.price_formatted || `Rp ${priceNum.toLocaleString('id-ID')}`,
          image: img,
          qty: 1,
          size
        }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number, size: string) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id: number, size: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id, size);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.id === id && item.size === size) {
        return { ...item, qty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, curr) => acc + curr.qty, 0);
  const totalPrice = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalCount,
      totalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
