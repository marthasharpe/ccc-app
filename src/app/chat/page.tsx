"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import CCCModal from "@/components/CCCModal";
import { LinkifyCCC, hasCCCReferences } from "@/utils/linkifyCCC";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  isTokenLimitReached,
  addCostUsage,
  wouldExceedTokenLimit,
  getUserStatus,
  calculateCost,
} from "@/lib/usageTracking";
import { estimateTokens } from "@/lib/usageClient";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCCCReference, setSelectedCCCReference] = useState<
    string | null
  >(null);
  const [isCCCModalOpen, setIsCCCModalOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [usagePercentage, setUsagePercentage] = useState(0);
  const [estimatedTokensForRequest, setEstimatedTokensForRequest] = useState(0);
  const [userStatus, setUserStatus] = useState<{
    isAuthenticated: boolean;
    dailyLimit: number;
    costUsed: number;
    remainingCost: number;
    usagePercentage: number;
  } | null>(null);
  const [selectedModel, setSelectedModel] = useState<"gpt-4" | "gpt-3.5-turbo">(
    "gpt-4"
  );

  const handleClearQuestion = () => {
    setQuestion("");
    setAnswer(null);
  };

  const handleCCCClick = (reference: string) => {
    setSelectedCCCReference(reference);
    setIsCCCModalOpen(true);
  };

  // Check usage limits on component mount
  useEffect(() => {
    const checkUsage = async () => {
      const status = await getUserStatus();
      const limitReached = await isTokenLimitReached();

      setUserStatus(status);
      setUsagePercentage(status.usagePercentage);
      setIsLimitReached(limitReached);
    };

    checkUsage();
  }, []);

  const updateUsageCount = async () => {
    const status = await getUserStatus();
    const limitReached = await isTokenLimitReached();

    setUserStatus(status);
    setUsagePercentage(status.usagePercentage);
    setIsLimitReached(limitReached);
  };

  // Update estimated tokens when question changes
  useEffect(() => {
    if (question.trim()) {
      const estimated = estimateTokens(question);
      setEstimatedTokensForRequest(estimated + 300); // Add ~300 for system prompt and response
    } else {
      setEstimatedTokensForRequest(0);
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    // Check if request would exceed daily cost limit
    const estimated = estimateTokens(question) + 300; // Add ~300 for system prompt and response
    const wouldExceed = await wouldExceedTokenLimit(estimated, selectedModel);
    if (wouldExceed) {
      setShowLimitDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question.trim(),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setAnswer(data.response);

      // Add actual cost usage after successful response
      if (data.tokensUsed) {
        await addCostUsage(data.tokensUsed, selectedModel);
      }
      await updateUsageCount();
    } catch (error) {
      console.error("Chat error:", error);
      setAnswer(
        "I apologize, but I encountered an error. Please try your question again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 sm:px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            Ask About Catholic Teaching
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Ask a question and get a response based on the Catechism of the
            Catholic Church
          </p>
        </div>

        {/* Model Selection */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Model:</span>
              <div className="flex rounded-md border">
                <Button
                  variant={
                    selectedModel === "gpt-3.5-turbo" ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => setSelectedModel("gpt-3.5-turbo")}
                  className="rounded-r-none border-r cursor-pointer"
                >
                  GPT-3.5
                </Button>
                <Button
                  variant={selectedModel === "gpt-4" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedModel("gpt-4")}
                  className="rounded-l-none cursor-pointer"
                >
                  GPT-4.0
                </Button>
              </div>
            </div>

            {answer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQuestion}
                className="text-xs"
              >
                Clear Question
              </Button>
            )}
          </div>

          {/* Model Description */}
          <div className="max-w-xl text-center px-4">
            {selectedModel === "gpt-3.5-turbo" ? (
              <div className="text-xs sm:text-sm text-muted-foreground">
                * GPT-3.5 - Good for basic questions about Catholic teaching.
                May occasionally provide less detailed explanations. Uses less
                data per response.
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground">
                * GPT-4.0 - More thoughtful and comprehensive responses. Better
                at handling complex theological questions. Uses more data per
                response.
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {userStatus?.isAuthenticated ? (
              <span className="text-green-600">
                ✓ Signed in: Enhanced daily usage limit
              </span>
            ) : (
              <span>
                Free daily usage limit
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline ml-1"
                >
                  (Sign in for more)
                </Link>
              </span>
            )}
          </div>
        </div>

        {/* Question Input */}
        <div className="mb-8 w-full max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about Catholic teaching?"
              disabled={isLoading}
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="shrink-0 w-full sm:w-auto"
            >
              {isLoading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                "Ask"
              )}
            </Button>
          </form>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Responses are based on the Catechism of the Catholic Church and
              official Church teaching.
            </p>
          </div>
          {isLimitReached ? (
            <p className="text-xs text-red-500">Daily usage limit reached</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {100 - usagePercentage}% usage remaining today
              {estimatedTokensForRequest > 0 && (
                <span className="ml-2 text-xs">
                  (∼
                  {Math.round(
                    calculateCost(estimatedTokensForRequest, selectedModel) *
                      100
                  ) / 100}
                  % estimated for this request)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Thinking...</p>
          </div>
        )}

        {/* Answer Display */}
        {answer && !isLoading && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 sm:p-6 bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-primary">
                  Response:
                </span>
              </div>
              <div className="text-foreground leading-relaxed">
                {hasCCCReferences(answer) ? (
                  <LinkifyCCC text={answer} onCCCClick={handleCCCClick} />
                ) : (
                  answer
                )}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for no question */}
        {!question && !isLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border p-4">
                <h3 className="font-medium mb-2">Suggested Topics</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Prayer and Spirituality</li>
                  <li>• The Sacraments</li>
                  <li>• Moral Teaching</li>
                  <li>• Trinity and Doctrine</li>
                </ul>
              </div>

              <div className="border p-4">
                <h3 className="font-medium mb-2">Example Questions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• &ldquo;What is prayer?&rdquo;</li>
                  <li>• &ldquo;How do I prepare for confession?&rdquo;</li>
                  <li>
                    • &ldquo;What does the Church teach about marriage?&rdquo;
                  </li>
                  <li>• &ldquo;How can I grow in virtue?&rdquo;</li>
                </ul>
              </div>

              <div className="border p-4">
                <h3 className="font-medium mb-2">How It Works</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ask any question about Catholic teaching</li>
                  <li>• Get answers based on the Catechism</li>
                  <li>• Click CCC references for full paragraphs</li>
                  <li>• Choose your preferred AI model</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Daily Limit Alert Dialog */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Daily Token Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              This request would exceed your daily usage limit.
              <br />
              <br />
              {userStatus?.isAuthenticated ? (
                <>
                  <strong>You can:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      Try a shorter question to use less of your daily limit
                    </li>
                    <li>
                      Switch to GPT-3.5 which uses less of your daily limit per
                      response
                    </li>
                    <li>Browse and search the Catechism (no usage limit)</li>
                    <li>Wait until tomorrow for your usage to reset</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-sm font-medium text-primary">
                      💡 Sign in to get 2.5x more usage!
                    </p>
                    <p className="text-xs text-primary/80 mt-1">
                      Free accounts have limited usage → Signed in: Enhanced
                      daily limit
                    </p>
                  </div>
                  <strong>You can:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      Try a shorter question to use less of your daily limit
                    </li>
                    <li>
                      Switch to GPT-3.5 which uses less of your daily limit per
                      response
                    </li>
                    <li>Browse and search the Catechism (no usage limit)</li>
                    <li>
                      <strong>Sign in to get 2.5x more daily usage!</strong>
                    </li>
                    <li>Wait until tomorrow for your usage to reset</li>
                  </ul>
                </>
              )}
              <div className="mt-3 p-2 bg-muted rounded text-sm">
                <strong>Usage remaining:</strong> {100 - usagePercentage}%
                <br />
                <strong>Estimated needed:</strong> ~
                {Math.round(
                  calculateCost(estimatedTokensForRequest, selectedModel) * 100
                ) / 100}
                %
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            {!userStatus?.isAuthenticated && (
              <AlertDialogAction asChild>
                <Link
                  href="/auth/login"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sign In for More Usage
                </Link>
              </AlertDialogAction>
            )}
            {selectedModel === "gpt-4" && (
              <AlertDialogAction
                onClick={() => {
                  setSelectedModel("gpt-3.5-turbo");
                  setShowLimitDialog(false);
                }}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Switch to GPT-3.5
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={() => setShowLimitDialog(false)}>
              I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
