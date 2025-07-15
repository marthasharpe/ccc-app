"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserResponse } from "@/lib/userResponses";
import { copyResponseToClipboard } from "@/utils/copyResponse";
import { useRouter } from "next/navigation";
import { LinkifyCCC } from "@/utils/linkifyCCC";
import SearchBar from "@/components/SearchBar";

interface SearchResult {
  success: boolean;
  data: UserResponse[];
  count: number;
  error?: string;
}

export default function SavedResponsesPage() {
  const [results, setResults] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"semantic" | "keyword" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(
    new Set()
  );
  const router = useRouter();

  // Load recent responses on component mount
  const loadRecentResponses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/user-responses/recent");
      const data: SearchResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load recent questions");
      }

      if (data.success) {
        setResults(data.data);
        setSearchType(null);
      }
    } catch (err) {
      console.error("Error loading recent questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentResponses();
  }, [loadRecentResponses]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      loadRecentResponses();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First try keyword search
      const keywordResponse = await fetch(
        `/api/user-responses/search/keyword`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim(), limit: 20 }),
        }
      );

      const keywordData: SearchResult = await keywordResponse.json();

      if (
        keywordResponse.ok &&
        keywordData.success &&
        keywordData.data.length > 0
      ) {
        // If keyword search returns results, use them
        setResults(keywordData.data);
        setSearchType("keyword");
        return;
      }

      // If no keyword results, try semantic search
      const semanticResponse = await fetch(
        `/api/user-responses/search/semantic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim(), limit: 20 }),
        }
      );

      const semanticData: SearchResult = await semanticResponse.json();

      if (!semanticResponse.ok) {
        throw new Error(semanticData.error || "Search failed");
      }

      if (semanticData.success) {
        setResults(semanticData.data);
        setSearchType("semantic");
      }
    } catch (err) {
      console.error("Error in search:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchType(null);
    loadRecentResponses();
  };

  const deleteResponse = async (response: UserResponse) => {
    if (deletingIds.has(response.id)) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(response.id));

    try {
      const deleteResponse = await fetch(
        `/api/user-responses/delete/${response.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await deleteResponse.json();

      if (!deleteResponse.ok) {
        throw new Error(data.error || "Failed to delete response");
      }

      if (data.success) {
        // Remove from current results
        setResults((prev) => prev.filter((r) => r.id !== response.id));
        console.log("Response deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting response:", err);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(response.id);
        return newSet;
      });
    }
  };

  const copyResponse = async (response: UserResponse) => {
    if (copyingIds.has(response.id)) {
      return;
    }

    setCopyingIds((prev) => new Set(prev).add(response.id));

    try {
      const success = await copyResponseToClipboard(
        response.prompt,
        response.response
      );
      if (success) {
        setCopiedIds((prev) => new Set(prev).add(response.id));
        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopiedIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(response.id);
            return newSet;
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Error copying response:", error);
    } finally {
      setCopyingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(response.id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  const toggleResponseExpansion = (responseId: string) => {
    setExpandedResponses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Search Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Search Your Bookmarks</h1>
          <p className="text-lg">
            Find previous questions and responses you saved
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={performSearch}
            onNewSearch={clearSearch}
            isLoading={isLoading}
            showNewSearchButton={searchType !== null}
            placeholder="Enter a keyword or topic..."
            showSearchIcon={true}
          />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Searching questions...</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                {searchType ? (
                  <>Search Results ({results.length})</>
                ) : (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Questions ({results.length})
                  </>
                )}
              </h2>
            </div>

            {/* No Results */}
            {results.length === 0 && !error && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchType
                      ? "No results found for your search."
                      : "No saved responses yet."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results List */}
            {results.map((response) => (
              <Card
                key={response.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 flex-1 pr-4">
                      {response.prompt}
                    </CardTitle>
                    <div className="flex items-start gap-2 ml-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyResponse(response)}
                          disabled={copyingIds.has(response.id)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title={
                            copiedIds.has(response.id)
                              ? "Copied!"
                              : "Copy response"
                          }
                        >
                          {copyingIds.has(response.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : copiedIds.has(response.id) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteResponse(response)}
                          disabled={deletingIds.has(response.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                          title="Delete response"
                        >
                          {deletingIds.has(response.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(response.created_at)}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* View Response Toggle */}
                  <div className="mb-3">
                    <div
                      onClick={() => toggleResponseExpansion(response.id)}
                      className="flex items-center gap-2 p-0 h-auto font-medium text-primary hover:text-primary/80 cursor-pointer"
                      title="Toggle response view"
                    >
                      {expandedResponses.has(response.id) ? (
                        <>
                          Response
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Response
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expandable Response Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedResponses.has(response.id)
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        <LinkifyCCC
                          text={response.response}
                          onCCCClick={handleCCCClick}
                        />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
