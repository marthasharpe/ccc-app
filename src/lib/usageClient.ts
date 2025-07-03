/**
 * Client-side usage tracking for anonymous users
 * Uses localStorage to track daily chat usage limits
 */

const STORAGE_KEY = "cathcat_daily_usage";
const DAILY_TOKEN_LIMIT = 2000;

interface DailyUsage {
  date: string; // YYYY-MM-DD format
  tokensUsed: number;
  // Legacy fields for migration
  gpt4Count?: number;
  gpt35Count?: number;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the current usage data from localStorage
 */
function getStoredUsage(): DailyUsage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        date: getTodayString(),
        tokensUsed: 0,
      };
    }

    const usage: Partial<DailyUsage> & { chatCount?: number } =
      JSON.parse(stored);

    // Reset if the stored date is not today
    if (usage.date !== getTodayString()) {
      return {
        date: getTodayString(),
        tokensUsed: 0,
      };
    }

    return {
      date: usage.date || getTodayString(),
      tokensUsed: usage.tokensUsed || 0,
    };
  } catch (error) {
    console.warn("Failed to parse usage data from localStorage:", error);
    return {
      date: getTodayString(),
      tokensUsed: 0,
    };
  }
}

/**
 * Save usage data to localStorage
 */
function saveUsage(usage: DailyUsage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.warn("Failed to save usage data to localStorage:", error);
  }
}

/**
 * Get the current token usage for today
 */
export async function getTokenUsage(): Promise<number> {
  const usage = getStoredUsage();
  return usage.tokensUsed;
}

/**
 * Add tokens to the daily usage count
 */
export async function addTokenUsage(tokens: number): Promise<void> {
  const usage = getStoredUsage();
  usage.tokensUsed += tokens;
  saveUsage(usage);
}

/**
 * Check if the user has reached the daily token limit
 */
export async function isTokenLimitReached(): Promise<boolean> {
  const tokensUsed = await getTokenUsage();
  return tokensUsed >= DAILY_TOKEN_LIMIT;
}

/**
 * Check if a request would exceed the daily token limit
 */
export async function wouldExceedTokenLimit(
  estimatedTokens: number
): Promise<boolean> {
  const tokensUsed = await getTokenUsage();
  return tokensUsed + estimatedTokens > DAILY_TOKEN_LIMIT;
}

/**
 * Get the remaining tokens for today
 */
export async function getRemainingTokens(): Promise<number> {
  const tokensUsed = await getTokenUsage();
  return Math.max(0, DAILY_TOKEN_LIMIT - tokensUsed);
}

/**
 * Get the daily token limit
 */
export function getDailyTokenLimit(): number {
  return DAILY_TOKEN_LIMIT;
}

/**
 * Estimate tokens for a given text (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Legacy functions for backward compatibility (now redirect to token-based system)
export async function getChatUsageCount(): Promise<number> {
  return await getTokenUsage();
}

export async function incrementChatUsageCount(): Promise<void> {
  // No-op - tokens are now tracked via addTokenUsage
}

export async function isChatLimitReached(): Promise<boolean> {
  return await isTokenLimitReached();
}

export async function getRemainingChatCount(): Promise<number> {
  return await getRemainingTokens();
}

export function getDailyChatLimit(): number {
  return DAILY_TOKEN_LIMIT;
}
