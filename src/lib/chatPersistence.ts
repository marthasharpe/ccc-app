interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  messages: Message[];
  selectedModel: "gpt-4" | "gpt-3.5-turbo";
  lastUpdated: Date;
}

const CHAT_STORAGE_KEY = "mycat_current_chat";

export const saveChatSession = (
  messages: Message[],
  selectedModel: "gpt-4" | "gpt-3.5-turbo"
) => {
  try {
    const session: ChatSession = {
      messages,
      selectedModel,
      lastUpdated: new Date(),
    };

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save chat session:", error);
  }
};

export const loadChatSession = (): ChatSession | null => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as ChatSession;

    // Convert timestamp strings back to Date objects
    session.messages = session.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    session.lastUpdated = new Date(session.lastUpdated);

    return session;
  } catch (error) {
    console.error("Failed to load chat session:", error);
    return null;
  }
};

export const clearChatSession = () => {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear chat session:", error);
  }
};

export const getDefaultWelcomeMessage = (): Message => ({
  id: "welcome",
  content: `Welcome! I'm here to help with questions about Catholic teaching.

Try asking about prayer, sacraments, moral life, or any topic in the Catechism.`,
  isUser: false,
  timestamp: new Date(),
});
