"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { LinkifyCCC, hasCCCReferences } from "@/utils/linkifyCCC";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import {
  isTokenLimitReached,
  addTokenUsage,
  wouldExceedTokenLimit,
  getUserStatus,
  estimateTokens,
} from "@/lib/usageTracking";
import { UsageAlertDialog } from "@/components/UsageAlertDialog";

export default function ChatPage() {
  const {
    chatState,
    setQuestion,
    setAnswer,
    setSubmittedQuestion,
    setSelectedModel,
    clearChat,
  } = useChat();
  const { question, answer, submittedQuestion, selectedModel } = chatState;
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [userStatus, setUserStatus] = useState<{
    isAuthenticated: boolean;
    dailyLimit: number;
    tokensUsed: number;
    remainingTokens: number;
    usagePercentage: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleClearQuestion = () => {
    clearChat();
    // Focus the input after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleCCCClick = (reference: string) => {
    router.push(`/paragraph/${reference}`);
  };

  // Check usage limits on component mount and when model changes
  useEffect(() => {
    const checkUsage = async () => {
      const status = await getUserStatus();
      const limitReached = await isTokenLimitReached();
      setUserStatus(status);
      setIsLimitReached(limitReached);
    };

    checkUsage();
  }, [selectedModel]);

  const updateUsageCount = async () => {
    const status = await getUserStatus();
    const limitReached = await isTokenLimitReached();

    setUserStatus(status);
    setIsLimitReached(limitReached);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    // Default to GPT-4 for all users
    if (selectedModel === "gpt-3.5-turbo") {
      setSelectedModel("gpt-4");
      return;
    }

    // Check if request would exceed daily cost limit
    const estimated = estimateTokens(question) + 300; // Add ~300 for system prompt and response
    const wouldExceed = await wouldExceedTokenLimit(estimated);
    if (wouldExceed) {
      setShowLimitDialog(true);
      return;
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
      // Add actual cost usage after successful response
      if (data.tokensUsed) {
        await addTokenUsage(data.tokensUsed);
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
          <p className="text-lg max-w-2xl mx-auto">
            Get answers based on the Catechism of the Catholic Church{" "}
            <a 
              href="/about" 
              className="inline-flex items-center text-primary hover:text-primary/80 ml-1"
              title="Learn more about the Catechism"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
          </p>
        </div>

        {/* Question Input - New Layout (only show when no answer) */}
        {!answer && (
          <div className="mb-8 w-full max-w-2xl mx-auto">
            {isLimitReached ? (
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
                    {userStatus?.isAuthenticated
                      ? "Upgrade your account to ask unlimited questions or come back tomorrow."
                      : "Create an account to keep asking questions or come back tomorrow."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {userStatus?.isAuthenticated ? (
                    <Button
                      className="px-8"
                      onClick={() => router.push("/plans")}
                    >
                      View Pricing
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="px-8"
                        onClick={() => (window.location.href = "/auth/login")}
                      >
                        Login
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Normal question input form */
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                    maxLength={500}
                    className="flex-1"
                  />
                  {question.trim() && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto shrink-0"
                    >
                      {isLoading ? (
                        <svg
                          className="w-4 h-4 animate-spin mr-2"
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
                      ) : null}
                      Ask
                    </Button>
                  )}
                </div>
              </form>
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

      {/* Usage Alert Dialog */}
      <UsageAlertDialog
        isOpen={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        userStatus={userStatus}
      />
    </div>
  );
}
