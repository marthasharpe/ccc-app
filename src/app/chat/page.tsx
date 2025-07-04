"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(
    null
  );
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
  const [selectedModel, setSelectedModel] = useState<"gpt-4" | "gpt-3.5-turbo">(() => {
    // Initialize with saved model preference or default to "gpt-4"
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("selectedModel");
      if (savedModel && (savedModel === "gpt-4" || savedModel === "gpt-3.5-turbo")) {
        return savedModel;
      }
    }
    return "gpt-4";
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save model preference when it changes
  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  const handleClearQuestion = () => {
    setQuestion("");
    setAnswer(null);
    setSubmittedQuestion(null);
    // Focus the textarea after clearing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
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
    setSubmittedQuestion(question.trim()); // Store the submitted question

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
            Your Catholic Teaching Assistant
          </h1>
          <p className="text-lg max-w-2xl mx-auto">
            AI responses are based on the Catechism of the Catholic Church
          </p>
        </div>

        {/* Question Input - New Layout (only show when no answer) */}
        {!answer && (
          <div className="mb-8 w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Text Input Area */}
              <div className="mb-4">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                    "min-h-[80px] max-h-[200px] resize-none"
                  )}
                  maxLength={500}
                  rows={3}
                />
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-between">
                {/* Model Selector - Bottom Left */}
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedModel}
                    onValueChange={(value) =>
                      setSelectedModel(value as "gpt-4" | "gpt-3.5-turbo")
                    }
                  >
                    <SelectTrigger className="w-32" tabIndex={-1}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4.0</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ask Button - Bottom Right */}
                <div className="flex items-center gap-2">
                  {question.trim() && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      size="sm"
                      className="px-6"
                      tabIndex={0}
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
                  )}
                </div>
              </div>
            </form>

            {/* Usage Limit Warning */}
            {isLimitReached && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Daily usage limit reached.{" "}
                {userStatus?.isAuthenticated ? (
                  <span>Upgrade to a paid plan for unlimited usage.</span>
                ) : (
                  <span>Create an account to get more usage.</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Clear Question Button (show when answer exists) */}
        {answer && (
          <div className="flex justify-center mb-6">
            <Button
              variant="outline"
              size="lg"
              onClick={handleClearQuestion}
              className="px-8 cursor-pointer"
            >
              Ask Another Question
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Thinking...</p>
          </div>
        )}

        {/* Answer Display */}
        {answer && !isLoading && submittedQuestion && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 sm:p-6 bg-card">
              {/* Question Section */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-sm font-medium text-primary">
                    Your Question:
                  </span>
                </div>
                <div className="text-foreground leading-relaxed font-medium">
                  {submittedQuestion}
                </div>
              </div>

              {/* Response Section */}
              <div>
                <div className="flex items-center mb-3">
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
