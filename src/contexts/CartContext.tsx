import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItemVariation {
  id: string;
  type: string;
  name: string;
  price_modifier: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  variations: CartItemVariation[];
  observations?: string;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const addItem = (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    setItems((prev) => {
      const updated = [...prev, newItem];
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.basePrice + 
        item.variations.reduce((sum, v) => sum + v.price_modifier, 0);
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{ items, addItem, updateItem, removeItem, clearCart, getTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
