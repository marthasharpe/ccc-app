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
              <p className="text-muted-foreground">
                Find passages from the Catechism of the Catholic Church
              </p>
            </div>

            <div className="mb-8">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
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

            {/* Placeholder results for demo */}
            {!query && !isLoading && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Enter a search term to find relevant passages, or type a
                    paragraph number for direct access
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border p-4">
                    <h3 className="font-medium mb-2">Popular Topics</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Prayer</li>
                      <li>• Sacraments</li>
                      <li>• Ten Commandments</li>
                      <li>• Trinity</li>
                    </ul>
                  </div>

                  <div className="border p-4">
                    <h3 className="font-medium mb-2">How to Search</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use specific terms for exact matches</li>
                      <li>• Try different phrasings for concepts</li>
                      <li>• Search uses both keyword and AI understanding</li>
                    </ul>
                  </div>

                  <div className="border p-4">
                    <h3 className="font-medium mb-2">Paragraph Numbers</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Type &ldquo;1234&rdquo; for paragraph 1234</li>
                      <li>
                        • Type &ldquo;CCC 1234&rdquo; or &ldquo;#1234&rdquo;
                      </li>
                      <li>• Type &ldquo;1234-1236&rdquo; for ranges</li>
                      <li>• Try &ldquo;paragraph 1234&rdquo;</li>
                    </ul>
                  </div>
                </div>
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
