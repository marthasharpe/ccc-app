// Example of how to integrate the save functionality in your chat component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ChatWithSave() {
  const [prompt] = useState("");
  const [, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    // Your existing chat logic here...
    // After getting the response from OpenAI, save it:
    
    setIsLoading(true);
    try {
      // 1. Call your chat API to get response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const chatData = await chatResponse.json();
      setResponse(chatData.response);
      
      // 2. Automatically save the response
      await saveResponse(prompt, chatData.response, chatData.tokensUsed);
      
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResponse = async (userPrompt: string, aiResponse: string, tokens: number) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user-responses/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          response: aiResponse,
          tokensUsed: tokens,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error("Failed to save response:", data.error);
      } else {
        console.log("Response saved successfully:", data.id);
      }
    } catch (error) {
      console.error("Error saving response:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Your chat UI here */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
        {isSaving && (
          <span className="text-sm text-muted-foreground">Saving...</span>
        )}
      </div>
    </div>
  );
}