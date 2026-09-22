import React, { createContext, useCallback, useContext, useState } from "react";

interface FavoritesContextType {
  favorites: Set<string>;
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  favoriteCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const addToFavorites = useCallback((productId: string) => {
    setFavorites((current) => new Set(current).add(productId));
  }, []);

  const removeFromFavorites = useCallback((productId: string) => {
    setFavorites((current) => {
      const newSet = new Set(current);
      newSet.delete(productId);
      return newSet;
    });
  }, []);

  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        favoriteCount: favorites.size
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
