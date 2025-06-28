"use client";

import { useState, useEffect } from "react";
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

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: `Welcome! I'm here to help with questions about Catholic teaching.

Try asking about prayer, sacraments, moral life, or any topic in the Catechism.

Example questions:

• "What is prayer?"
• "How do I prepare for confession?"
• "What does the Church teach about marriage?"
• "How can I grow in virtue?"`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCCCReference, setSelectedCCCReference] = useState<
    string | null
  >(null);
  const [isCCCModalOpen, setIsCCCModalOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpt-4" | "gpt-3.5-turbo">(
    "gpt-3.5-turbo"
  );

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

    if (!input.trim() || isLoading) return;

    // Check if user has reached daily limit
    const limitReached = await isChatLimitReached();
    console.log("Limit check:", { limitReached, input: input.trim() }); // Debug log
    if (limitReached) {
      setShowLimitDialog(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Increment usage count after successful response
      await incrementChatUsageCount();
      await updateUsageCount();
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error. Please try your question again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Catholic Catechism Assistant
        </h1>
        <p className="text-muted-foreground">
          Ask questions about Catholic teachings and receive answers based on
          the Catechism of the Catholic Church
        </p>

        {/* Model Selection */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Model:</span>
            <div className="flex rounded-md border">
              <Button
                variant={
                  selectedModel === "gpt-3.5-turbo" ? "default" : "ghost"
                }
                size="sm"
                onClick={() => setSelectedModel("gpt-3.5-turbo")}
                className="rounded-r-none border-r"
              >
                GPT-3.5*
              </Button>
              <Button
                variant={selectedModel === "gpt-4" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedModel("gpt-4")}
                className="rounded-l-none"
              >
                GPT-4*
              </Button>
            </div>
          </div>

          {/* Model Description */}
          <div className="max-w-xl text-center">
            {selectedModel === "gpt-3.5-turbo" ? (
              <div className="text-xs text-muted-foreground">
                * Good for basic questions about Catholic teaching. May
                occasionally provide less detailed explanations or miss subtle
                theological nuances. Faster and lower cost.
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                * More thoughtful and comprehensive responses. Better at
                handling complex theological questions and providing nuanced
                explanations. Slower and higher cost.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border min-h-[500px] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 mx-auto text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  />
                </svg>
              </div>
              <p className="text-lg mb-2">
                Welcome! I&apos;m here to help with questions about Catholic
                teaching.
              </p>
              <p className="text-sm">
                Try asking about prayer, sacraments, moral life, or any topic in
                the Catechism.
              </p>
              <div className="mt-6 grid gap-2 max-w-md mx-auto text-left">
                <p className="text-xs font-medium text-muted-foreground">
                  Example questions:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• &ldquo;What is prayer?&rdquo;</li>
                  <li>• &ldquo;How do I prepare for confession?&rdquo;</li>
                  <li>
                    • &ldquo;What does the Church teach about marriage?&rdquo;
                  </li>
                  <li>• &ldquo;How can I grow in virtue?&rdquo;</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.isUser
                    ? "bg-primary text-primary-foreground ml-12"
                    : "bg-muted mr-12"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.isUser || !hasCCCReferences(message.content) ? (
                    message.content
                  ) : (
                    <LinkifyCCC
                      text={message.content}
                      onCCCClick={handleCCCClick}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3 mr-12">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about Catholic teaching..."
              disabled={isLoading}
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </form>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              Responses are based on the Catechism of the Catholic Church and
              official Church teaching.
            </p>
            {isLimitReached && (
              <p className="text-xs text-red-500">Daily limit reached</p>
            )}
          </div>
        </div>
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
