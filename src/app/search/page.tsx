"use client";

import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { detectParagraphQuery } from "@/utils/detectParagraphQuery";
import { FormatCCCContent } from "@/utils/formatCCCContent";
import { useSearch, type SearchResult } from "@/contexts/SearchContext";

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export default function SearchPage() {
  const router = useRouter();
  const {
    searchState,
    setQuery,
    setResults,
    setIsLoading,
    setShouldFocusInput,
    clearSearch,
  } = useSearch();
  const { query, results, isLoading, shouldFocusInput } = searchState;

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setQuery(searchQuery);
    setResults([]);

    // Check if this is a paragraph number query
    const paragraphQuery = detectParagraphQuery(searchQuery);

    if (paragraphQuery.isParagraphQuery) {
      // Navigate to paragraph page instead of showing inline
      router.push(`/paragraph/${paragraphQuery.reference}`);
      setIsLoading(false);
      return;
    }

    // Regular semantic search
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    clearSearch();
    setShouldFocusInput(true);
  };

  const handleParagraphClick = (paragraphNumber: number) => {
    router.push(`/paragraph/${paragraphNumber}`);
  };

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Search the Catechism</h1>
          <p className="text-lg">
            Find passages from the Catechism of the Catholic Church{" "}
            <a
              href="/about"
              className="inline-flex items-center text-primary hover:text-primary/80 ml-1"
              title="Learn more about the Catechism"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            showNewSearchButton={results.length > 0 && !isLoading}
            onNewSearch={handleNewSearch}
            shouldFocus={shouldFocusInput}
            onFocused={() => setShouldFocusInput(false)}
          />
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Searching...</p>
          </div>
        )}

        {query && !isLoading && (
          <div className="mb-4">
            <p className="text-muted-foreground">
              {results.length > 0
                ? `Top results for "${query}"`
                : `No results found for "${query}"`}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result) => (
              <div
                key={result.id}
                className="border rounded-lg p-6 bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleParagraphClick(result.paragraph_number)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-primary">
                    CCC {result.paragraph_number}
                  </span>
                </div>
                <div className="text-foreground leading-relaxed">
                  <FormatCCCContent
                    content={result.content}
                    onCCCClick={handleCCCClick}
                    searchQuery={query}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
