"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ParagraphDisplay from "@/components/ParagraphDisplay";
import { detectParagraphQuery } from "@/utils/detectParagraphQuery";
import { FormatCCCContent } from "@/utils/formatCCCContent";
import CCCModal from "@/components/CCCModal";

interface SearchResult {
  id: number;
  paragraph_number: number;
  content: string;
  similarity: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paragraphReference, setParagraphReference] = useState<string | null>(
    null
  );
  const [showParagraphView, setShowParagraphView] = useState(false);
  const [selectedCCCReference, setSelectedCCCReference] = useState<
    string | null
  >(null);
  const [isCCCModalOpen, setIsCCCModalOpen] = useState(false);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setQuery(searchQuery);
    setShowParagraphView(false);
    setResults([]);

    // Check if this is a paragraph number query
    const paragraphQuery = detectParagraphQuery(searchQuery);

    if (paragraphQuery.isParagraphQuery) {
      // Show paragraph directly instead of searching
      setParagraphReference(paragraphQuery.reference!);
      setShowParagraphView(true);
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
    setResults([]);
    setQuery("");
    setShowParagraphView(false);
    setParagraphReference(null);
    setShouldFocusInput(true);
  };

  const handleBackToSearch = () => {
    setShowParagraphView(false);
    setParagraphReference(null);
    // Don't clear query and results to preserve search state
    // Scroll to top when returning to search
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleParagraphClick = (paragraphNumber: number) => {
    setParagraphReference(paragraphNumber.toString());
    setShowParagraphView(true);
    // Scroll to top when navigating to paragraph view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCCCClick = (reference: string) => {
    setSelectedCCCReference(reference);
    setIsCCCModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Show paragraph view if viewing a specific paragraph */}
        {showParagraphView && paragraphReference ? (
          <ParagraphDisplay
            reference={paragraphReference}
            onBackToSearch={handleBackToSearch}
            onCCCClick={handleCCCClick}
          />
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Search the Catechism</h1>
              <p className="text-lg">
                Find passages from the Catechism of the Catholic Church
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
                <p className="text-sm text-muted-foreground">
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
                    onClick={() =>
                      handleParagraphClick(result.paragraph_number)
                    }
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-primary">
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
          </>
        )}

        {/* CCC Paragraph Modal */}
        <CCCModal
          paragraphReference={selectedCCCReference}
          isOpen={isCCCModalOpen}
          onClose={() => {
            setIsCCCModalOpen(false);
            setSelectedCCCReference(null);
          }}
          onCCCClick={handleCCCClick}
        />
      </div>
    </div>
  );
}
