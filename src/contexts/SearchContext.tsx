"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SearchResult {
  id: number;
  paragraph_number: number;
  content: string;
  similarity: number;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  shouldFocusInput: boolean;
}

interface SearchContextType {
  searchState: SearchState;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setShouldFocusInput: (shouldFocus: boolean) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const initialSearchState: SearchState = {
  query: "",
  results: [],
  isLoading: false,
  shouldFocusInput: false,
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);

  const setQuery = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  };

  const setResults = (results: SearchResult[]) => {
    setSearchState(prev => ({ ...prev, results }));
  };

  const setIsLoading = (isLoading: boolean) => {
    setSearchState(prev => ({ ...prev, isLoading }));
  };

  const setShouldFocusInput = (shouldFocusInput: boolean) => {
    setSearchState(prev => ({ ...prev, shouldFocusInput }));
  };

  const clearSearch = () => {
    setSearchState(initialSearchState);
  };

  return (
    <SearchContext.Provider
      value={{
        searchState,
        setQuery,
        setResults,
        setIsLoading,
        setShouldFocusInput,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

export type { SearchResult };