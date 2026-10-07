import React, { createContext, useCallback, useContext, useState } from "react";

const SearchOverlayContext = createContext(null);

export function SearchOverlayProvider({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <SearchOverlayContext.Provider
      value={{ searchOpen, setSearchOpen, openSearch, closeSearch }}
    >
      {children}
    </SearchOverlayContext.Provider>
  );
}

export function useSearchOverlay() {
  const context = useContext(SearchOverlayContext);
  if (!context) {
    throw new Error("useSearchOverlay must be used within a SearchOverlayProvider");
  }
  return context;
}
