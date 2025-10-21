"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Copy, Check, RotateCcw } from "lucide-react";
import { QueryInput } from "@/components/QueryInput";
import { formatCCCLinks, hasCCCReferences } from "@/utils/cccLinkFormatter";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import {
  isTokenLimitReached,
  addTokenUsage,
  wouldExceedTokenLimit,
  estimateTokens,
} from "@/lib/usageTracking";
import { UsageAlertDialog } from "@/components/UsageAlertDialog";
import { copyResponseToClipboard } from "@/utils/copyResponse";
import { ChatInstructions } from "@/components/ChatInstructions";
import { ModelToggle } from "@/components/ModelToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChatPage() {
  const {
    chatState,
    setQuestion,
    setAnswer,
    setSubmittedQuestion,
    setSelectedModel,
  } = useChat();
  const { question, answer, submittedQuestion, selectedModel } = chatState;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  // Check usage limits on component mount and when model changes (only for authenticated users)
  useEffect(() => {
    const checkUsage = async () => {
      if (isAuthenticated && !authLoading) {
        const limitReached = await isTokenLimitReached();
        setIsLimitReached(limitReached);
      }
    };

    checkUsage();
  }, [selectedModel, isAuthenticated, authLoading]);

  const updateUsageCount = async () => {
    if (isAuthenticated) {
      const limitReached = await isTokenLimitReached();
      setIsLimitReached(limitReached);
    }
  };

  const saveResponse = async () => {
    if (!submittedQuestion || !answer || isSaving || isSaved) return;

    // User is guaranteed to be authenticated at this point
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user-responses/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: submittedQuestion,
          response: answer,
          tokensUsed: 0, // We don't have this data in chat context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save response");
      }

      if (data.success) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error saving response:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyResponse = async () => {
    if (!submittedQuestion || !answer || isCopying) return;

    setIsCopying(true);
    try {
      const success = await copyResponseToClipboard(submittedQuestion, answer);
      if (success) {
        setIsCopied(true);
        // Reset copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error copying response:", error);
    } finally {
      setIsCopying(false);
    }
  };

  const regenerateResponse = async () => {
    if (!submittedQuestion || isRegenerating || isLoading) return;

    // Check if authenticated user would exceed daily cost limit
    if (isAuthenticated) {
      const estimated = estimateTokens(submittedQuestion) + 300; // Add ~300 for system prompt and response
      const wouldExceed = await wouldExceedTokenLimit(estimated);
      if (wouldExceed) {
        setShowLimitDialog(true);
        return;
      }
    }

    setIsRegenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: submittedQuestion,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setAnswer(data.response);
      // Add actual cost usage after successful response (only for authenticated users)
      if (isAuthenticated && data.tokensUsed) {
        await addTokenUsage(data.tokensUsed);
        await updateUsageCount();
      }

      // Reset saved state since this is a new response
      setIsSaved(false);
      setIsCopied(false);
    } catch (error) {
      console.error("Regenerate error:", error);
      setAnswer(
        "I apologize, but I encountered an error. Please try your question again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLoginDialogAction = () => {
    setShowLoginDialog(false);
    router.push("/auth/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    // Check if authenticated user would exceed daily cost limit
    if (isAuthenticated) {
      const estimated = estimateTokens(question) + 300; // Add ~300 for system prompt and response
      const wouldExceed = await wouldExceedTokenLimit(estimated);
      if (wouldExceed) {
        setShowLimitDialog(true);
        return;
      }
    }

    setIsLoading(true);
    setSubmittedQuestion(question.trim());

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
      // Add actual cost usage after successful response (only for authenticated users)
      if (isAuthenticated && data.tokensUsed) {
        await addTokenUsage(data.tokensUsed);
        await updateUsageCount();
      }
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
          <p className="text-lg mx-auto">
            Get answers based on the Catechism of the Catholic Church{" "}
            <a
              href="/about"
              className="inline-flex items-center text-primary hover:text-primary/80 p-1"
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

        {/* Question Input (only show when no answer) */}
        <div className="mb-8 w-full mx-auto">
          {authLoading ? (
            /* Loading authentication state */
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          ) : isAuthenticated && isLimitReached ? (
            /* Usage Limit Reached - Replace textarea with warning */
            <div className="border border-primary rounded-md p-6 text-center">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 text-primary mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2">
                  Daily Usage Limit Reached
                </h3>
                <p className="mb-4">
                  View study plans to keep asking questions or come back
                  tomorrow.
                </p>
              </div>

              <Button className="px-8" onClick={() => router.push("/options")}>
                Get Unlimited Usage
              </Button>
            </div>
          ) : (
            /* Normal question input form */
            <>
              <form onSubmit={handleSubmit} data-lastpass-ignore>
                <QueryInput
                  ref={inputRef}
                  value={question}
                  onChange={setQuestion}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  maxLength={500}
                  submitLabel="Ask"
                  containerClassName="w-full"
                />
              </form>
              <ModelToggle
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={isLoading}
              />
              {!answer && !isLoading && (
                <ChatInstructions
                  onExampleClick={(exampleQuestion) => {
                    setQuestion(exampleQuestion);
                    // Focus the input to show the question was set
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">
              Consulting Catholic teaching...
            </p>
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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">
                    Response:
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerateResponse}
                      disabled={isRegenerating || isLoading}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title="Regenerate response"
                    >
                      {isRegenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyResponse}
                      disabled={isCopying}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title={isCopied ? "Copied!" : "Copy response"}
                    >
                      {isCopying ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveResponse}
                      disabled={isSaving || isSaved}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title={isSaved ? "Response saved" : "Save response"}
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {isRegenerating ? (
                    <div className="text-center py-8">
                      <p className="mt-2">Generating new response...</p>
                    </div>
                  ) : hasCCCReferences(answer) ? (
                    formatCCCLinks({
                      text: answer,
                      onCCCClick: handleCCCClick,
                    })
                  ) : (
                    answer
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Alert Dialog */}
      <UsageAlertDialog
        isOpen={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        userStatus={{
          isAuthenticated: isAuthenticated,
          usagePercentage: 0,
        }}
      />

      {/* Login Required Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to save responses. Would you like to
              login now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLoginDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginDialogAction}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
