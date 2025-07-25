"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  showNewSearchButton?: boolean;
  onNewSearch?: () => void;
  shouldFocus?: boolean;
  onFocused?: () => void;
  placeholder?: string;
  showSearchIcon?: boolean;
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  showNewSearchButton = false,
  onNewSearch,
  shouldFocus = false,
  onFocused,
  placeholder = "Keyword or paragraph number...",
  showSearchIcon = false,
  initialQuery = "",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
      onFocused?.();
    }
  }, [shouldFocus, onFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleNewSearch = () => {
    setQuery("");
    onNewSearch?.();
  };

  // Show "New Search" button when results are displayed
  if (showNewSearchButton) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${className}`}>
        <div className="flex justify-center">
          <Button
            onClick={handleNewSearch}
            variant="outline"
            size="lg"
            className="px-8"
          >
            New Search
          </Button>
        </div>
      </div>
    );
  }

  // Show normal search form
  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-2xl mx-auto ${className}`}
      data-lastpass-ignore
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        {query.trim() && (
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto shrink-0"
          >
            {showSearchIcon && <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        )}
      </div>
    </form>
  );
}
