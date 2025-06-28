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
  onBackToSearch,
  onCCCClick,
}: ParagraphDisplayProps) {
  const [data, setData] = useState<CCCResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParagraph(reference);
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
    } catch (err) {
      console.error("Error fetching paragraph(s):", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isRange = data?.paragraphs !== undefined;
  const displayTitle = isRange
    ? `CCC ${data?.start_paragraph}-${data?.end_paragraph}`
    : `CCC ${data?.paragraph_number}`;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isLoading ? "Loading..." : displayTitle}
          </h2>
          <p className="text-muted-foreground text-sm">
            Catechism of the Catholic Church
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBackToSearch}
          className="flex items-center space-x-2 cursor-pointer"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back to Search</span>
        </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToSearch}
                className="mt-3 cursor-pointer"
              >
                Back to Search
              </Button>
            </div>
          </div>
        )}

        {data && (
          <div className="p-6 space-y-6">
            {isRange ? (
              // Display multiple paragraphs for ranges
              <div className="space-y-8">
                {data.paragraphs?.map((paragraph, index) => (
                  <div key={paragraph.paragraph_number} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                        CCC {paragraph.paragraph_number}
                      </span>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <div className="text-foreground leading-relaxed">
                        <FormatCCCContent
                          content={paragraph.content}
                          onCCCClick={onCCCClick}
                        />
                      </div>
                    </div>
                    {index < (data.paragraphs?.length || 0) - 1 && (
                      <div className="border-t border-muted mt-6" />
                    )}
                  </div>
                ))}
              </div>
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

      {/* Additional actions */}
      {data && !isLoading && !error && (
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <span>Want to search for something else?</span>
          <Button
            variant="link"
            size="sm"
            onClick={onBackToSearch}
            className="p-0 h-auto cursor-pointer"
          >
            Go back to search
          </Button>
        </div>
      )}
    </div>
  );
}
