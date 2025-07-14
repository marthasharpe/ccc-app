"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormatCCCContent } from "@/utils/formatCCCContent";

interface ParagraphDisplayProps {
  reference: string; // "1234" or "1234-1236"
  onBackToSearch: () => void;
  onCCCClick?: (reference: string) => void; // For nested paragraph links
}

interface CCCParagraph {
  paragraph_number: number;
  content: string;
}

interface CCCResponse {
  // Single paragraph response
  paragraph_number?: number;
  content?: string;
  // Range response
  start_paragraph?: number;
  end_paragraph?: number;
  paragraphs?: CCCParagraph[];
}

export default function ParagraphDisplay({
  reference,
  onCCCClick,
}: ParagraphDisplayProps) {
  const [data, setData] = useState<CCCResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

  useEffect(() => {
    fetchParagraph(reference);
    setCurrentParagraphIndex(0); // Reset to first paragraph when new data loads
  }, [reference]);

  const fetchParagraph = async (ref: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ccc/${ref}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch paragraph(s)");
      }

      const responseData = await response.json();
      setData(responseData);
      setCurrentParagraphIndex(0); // Reset to first paragraph when new data loads
    } catch (err) {
      console.error("Error fetching paragraph(s):", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isRange = data?.paragraphs !== undefined;

  // Navigation logic
  const canNavigatePrevious = isRange
    ? currentParagraphIndex > 0
    : (data?.paragraph_number || 1) > 1;

  const canNavigateNext = isRange
    ? currentParagraphIndex < (data?.paragraphs?.length || 1) - 1
    : (data?.paragraph_number || 2865) < 2865;

  const handleNavigatePrevious = () => {
    if (!canNavigatePrevious) return;

    if (isRange) {
      // Navigate within the current range
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    } else {
      // Navigate to previous single paragraph
      const prevNumber = (data?.paragraph_number || 1) - 1;
      if (prevNumber >= 1) {
        fetchParagraph(prevNumber.toString());
      }
    }
  };

  const handleNavigateNext = () => {
    if (!canNavigateNext) return;

    if (isRange) {
      // Navigate within the current range
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    } else {
      // Navigate to next single paragraph
      const nextNumber = (data?.paragraph_number || 2865) + 1;
      if (nextNumber <= 2865) {
        fetchParagraph(nextNumber.toString());
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation and back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">
              Catechism of the Catholic Church
            </h2>
          </div>

          {/* Navigation Buttons */}
          {data && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigatePrevious}
                disabled={!canNavigatePrevious || isLoading}
                className="p-0 cursor-pointer"
                title="Previous paragraph"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateNext}
                disabled={!canNavigateNext || isLoading}
                className="p-0 cursor-pointer"
                title="Next paragraph"
              >
                Next
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border rounded-lg">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground">
                Loading paragraph...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 text-sm font-medium">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {data && !isLoading && (
          <div className="p-6 space-y-6">
            {isRange ? (
              // Display current paragraph from range
              (() => {
                const currentParagraph =
                  data.paragraphs?.[currentParagraphIndex];
                if (!currentParagraph) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                        CCC {currentParagraph.paragraph_number}
                      </span>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <div className="text-foreground leading-relaxed">
                        <FormatCCCContent
                          content={currentParagraph.content}
                          onCCCClick={onCCCClick}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Display single paragraph
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    CCC {data.paragraph_number}
                  </span>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div className="text-foreground leading-relaxed">
                    <FormatCCCContent
                      content={data.content || ""}
                      onCCCClick={onCCCClick}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
