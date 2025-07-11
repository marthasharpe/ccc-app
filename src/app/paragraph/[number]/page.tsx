"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormatCCCContent } from "@/utils/formatCCCContent";

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

export default function ParagraphPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.number as string;

  const [data, setData] = useState<CCCResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

  useEffect(() => {
    if (reference) {
      fetchParagraph(reference);
      setCurrentParagraphIndex(0);
    }
  }, [reference]);

  const fetchParagraph = async (ref: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ccc/${ref}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Paragraph not found");
        } else {
          setError("Failed to fetch paragraph");
        }
        return;
      }

      const result: CCCResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching paragraph:", err);
      setError("Failed to fetch paragraph");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  const handlePreviousParagraph = () => {
    if (data?.paragraphs && currentParagraphIndex > 0) {
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
  };

  const handleNextParagraph = () => {
    if (
      data?.paragraphs &&
      currentParagraphIndex < data.paragraphs.length - 1
    ) {
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    }
  };

  const handleBackToSearch = () => {
    router.push("/search");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading paragraph...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Paragraph not found</p>
        </div>
      </div>
    );
  }

  // Handle single paragraph display
  if (data.paragraph_number && data.content) {
    const currentNumber = data.paragraph_number;
    const previousNumber = currentNumber - 1;
    const nextNumber = currentNumber + 1;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-primary">
                CCC {data.paragraph_number}
              </h1>
            </div>
            <div className="text-foreground leading-relaxed">
              <FormatCCCContent
                content={data.content}
                onCCCClick={handleCCCClick}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 pt-4 border-t mx-6">
            <Button
              onClick={() => router.push(`/paragraph/${previousNumber}`)}
              disabled={previousNumber < 1}
              variant="outline"
              size="sm"
            >
              ← CCC {previousNumber}
            </Button>
            <Button
              onClick={() => router.push(`/paragraph/${nextNumber}`)}
              variant="outline"
              size="sm"
            >
              CCC {nextNumber} →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle paragraph range display
  if (data.paragraphs && data.paragraphs.length > 0) {
    const currentParagraph = data.paragraphs[currentParagraphIndex];
    const totalParagraphs = data.paragraphs.length;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button onClick={handleBackToSearch} variant="outline" size="sm">
              ← Back to Search
            </Button>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-primary">
                CCC {currentParagraph.paragraph_number}
              </h1>
              {totalParagraphs > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePreviousParagraph}
                    disabled={currentParagraphIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentParagraphIndex + 1} of {totalParagraphs}
                  </span>
                  <Button
                    onClick={handleNextParagraph}
                    disabled={currentParagraphIndex === totalParagraphs - 1}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
            <div className="text-foreground leading-relaxed">
              <FormatCCCContent
                content={currentParagraph.content}
                onCCCClick={handleCCCClick}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
