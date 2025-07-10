"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatState {
  question: string;
  answer: string | null;
  submittedQuestion: string | null;
  selectedModel: "gpt-4" | "gpt-3.5-turbo";
}

interface ChatContextType {
  chatState: ChatState;
  setQuestion: (question: string) => void;
  setAnswer: (answer: string | null) => void;
  setSubmittedQuestion: (question: string | null) => void;
  setSelectedModel: (model: "gpt-4" | "gpt-3.5-turbo") => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialChatState: ChatState = {
  question: "",
  answer: null,
  submittedQuestion: null,
  selectedModel: "gpt-4", // Default to GPT-4
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>(initialChatState);

  const setQuestion = (question: string) => {
    setChatState(prev => ({ ...prev, question }));
  };

  const setAnswer = (answer: string | null) => {
    setChatState(prev => ({ ...prev, answer }));
  };

  const setSubmittedQuestion = (submittedQuestion: string | null) => {
    setChatState(prev => ({ ...prev, submittedQuestion }));
  };

  const setSelectedModel = (selectedModel: "gpt-4" | "gpt-3.5-turbo") => {
    setChatState(prev => ({ ...prev, selectedModel }));
  };

  const clearChat = () => {
    setChatState(prev => ({
      ...initialChatState,
      selectedModel: prev.selectedModel, // Preserve the selected model
    }));
  };

  return (
    <ChatContext.Provider
      value={{
        chatState,
        setQuestion,
        setAnswer,
        setSubmittedQuestion,
        setSelectedModel,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}