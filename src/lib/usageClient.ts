/**
 * Client-side usage tracking for anonymous users
 * Uses localStorage to track daily chat usage limits
 */

const STORAGE_KEY = "cathcat_daily_usage";
const DAILY_CHAT_LIMIT = 20;

interface DailyUsage {
  date: string; // YYYY-MM-DD format
  chatCount: number;
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
        chatCount: 0,
      };
    }

    const usage: DailyUsage = JSON.parse(stored);

    // Reset if the stored date is not today
    if (usage.date !== getTodayString()) {
      return {
        date: getTodayString(),
        chatCount: 0,
      };
    }

    return usage;
  } catch (error) {
    console.warn("Failed to parse usage data from localStorage:", error);
    return {
      date: getTodayString(),
      chatCount: 0,
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
 * Get the current chat usage count for today
 */
export async function getChatUsageCount(): Promise<number> {
  const usage = getStoredUsage();
  return usage.chatCount;
}

/**
 * Increment the chat usage count for today
 */
export async function incrementChatUsageCount(): Promise<void> {
  const usage = getStoredUsage();
  usage.chatCount += 1;
  saveUsage(usage);
}

/**
 * Check if the user has reached the daily chat limit
 */
export async function isChatLimitReached(): Promise<boolean> {
  const count = await getChatUsageCount();
  return count >= DAILY_CHAT_LIMIT;
}

/**
 * Get the remaining chat messages for today
 */
export async function getRemainingChatCount(): Promise<number> {
  const count = await getChatUsageCount();
  return Math.max(0, DAILY_CHAT_LIMIT - count);
}

/**
 * Get the daily chat limit (useful for displaying to users)
 */
export function getDailyChatLimit(): number {
  return DAILY_CHAT_LIMIT;
}
