"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { isChatLimitReached, incrementChatUsageCount } from "@/lib/usageClient";

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
      const limitReached = await isChatLimitReached();
      setIsLimitReached(limitReached);
    };

    checkUsage();
  }, []);

  const updateUsageCount = async () => {
    const limitReached = await isChatLimitReached();
    setIsLimitReached(limitReached);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    // Check if user has reached daily limit
    const limitReached = await isChatLimitReached();
    if (limitReached) {
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

      // Increment usage count after successful response
      await incrementChatUsageCount();
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
            Ask Your Teaching Assistant
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Hello! I am here to help you learn about Catholic teaching. I will
            do my best to provide clear, helpful answers based on the Catechism
            and provide links to the paragraphs I referenced so you can read
            more in context.
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
          <div className="max-w-2xl text-center px-4">
            {selectedModel === "gpt-3.5-turbo" ? (
              <div className="text-xs sm:text-sm text-muted-foreground">
                * GPT-3.5 - Good for basic questions about Catholic teaching.
                May occasionally provide less detailed explanations.
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground">
                * GPT-4.0 - More thoughtful and comprehensive responses. Better
                at handling complex theological questions.
              </div>
            )}
          </div>
        </div>

        {/* Question Input */}
        <div className="mb-8 w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
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
            {isLimitReached && (
              <p className="text-xs text-red-500">Daily limit reached</p>
            )}
          </div>
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
            <AlertDialogTitle>Daily Chat Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You can still browse and search the Catechism, but chat will be
              available again tomorrow.
              <br />
              <br />
              <strong>Want to keep chatting?</strong> Sign in to boost your
              daily limit!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowLimitDialog(false)}>
              I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
