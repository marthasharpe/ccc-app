"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatState {
  question: string;
  answer: string | null;
  submittedQuestion: string | null;
  selectedModel: "gpt-6.2-sol" | "gpt-5.4-mini";
}

interface ChatContextType {
  chatState: ChatState;
  setQuestion: (question: string) => void;
  setAnswer: (answer: string | null) => void;
  setSubmittedQuestion: (question: string | null) => void;
  setSelectedModel: (model: "gpt-6.2-sol" | "gpt-5.4-mini") => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialChatState: ChatState = {
  question: "",
  answer: null,
  submittedQuestion: null,
  selectedModel: "gpt-6.2-sol",
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

  const setSelectedModel = (selectedModel: "gpt-6.2-sol" | "gpt-5.4-mini") => {
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