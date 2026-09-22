import React, { createContext, useCallback, useContext, useState } from "react";
import type { Cart, CartItem } from "../types/product";
import { getProductById } from "../constants/products";

interface CartContextType {
  cart: Cart;
  addToCart: (productId: string, quantity: number, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  const calculateTotal = useCallback((items: CartItem[]) => {
    return items.reduce((sum, item) => {
      const product = getProductById(item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  }, []);

  const addToCart = useCallback(
    (productId: string, quantity: number, size?: string) => {
      setCart((current) => {
        const existingItem = current.items.find((item) => item.productId === productId && item.size === size);
        let newItems: CartItem[];

        if (existingItem) {
          newItems = current.items.map((item) =>
            item.productId === productId && item.size === size
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...current.items, { productId, quantity, size }];
        }

        return {
          items: newItems,
          total: calculateTotal(newItems)
        };
      });
    },
    [calculateTotal]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => {
      const newItems = current.items.filter((item) => item.productId !== productId);
      return {
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  }, [calculateTotal]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setCart((current) => {
        const newItems = quantity === 0
          ? current.items.filter((item) => item.productId !== productId)
          : current.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            );
        return {
          items: newItems,
          total: calculateTotal(newItems)
        };
      });
    },
    [calculateTotal]
  );

  const clearCart = useCallback(() => {
    setCart({ items: [], total: 0 });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount: cart.items.length
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
