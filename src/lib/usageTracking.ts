import { createClient } from "@/lib/supabase/client";

// Daily token limits
const ANONYMOUS_DAILY_TOKEN_LIMIT = 4000;
const AUTHENTICATED_DAILY_TOKEN_LIMIT = 4000;
const UNLIMITED_DAILY_TOKEN_LIMIT = 999999; // Effectively unlimited for paid options

// Anonymous user storage key
const TOKEN_STORAGE_KEY = "cathcat_daily_token_usage";

// Test users list - these users get access to experimental features
const TEST_USER_IDS = [
  "c1954f79-1823-4a4b-ab3e-722880cfe3fb",
  // Add more test user IDs here as needed
];

/**
 * Check if a user ID is in the test users list
 */
export function isTestUser(userId: string | null): boolean {
  if (!userId) return false;
  return TEST_USER_IDS.includes(userId);
}

/**
 * Check if the current authenticated user is a test user
 */
export async function isCurrentUserTestUser(): Promise<boolean> {
  const { isTestUser: testUser } = await getUserStatus();
  return testUser;
}

/**
 * Get the current date for daily resets at midnight local time
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get token usage from localStorage for anonymous users
 */
async function getLocalTokenUsage(): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return 0;

    const data = JSON.parse(stored);
    const currentDate = getCurrentDate();

    // Reset if it's a new day
    if (data.date !== currentDate) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return 0;
    }
    console.log("data.tokensUsed", data.tokensUsed);
    return data.tokensUsed || 0;
  } catch (error) {
    console.warn("Error reading local token usage:", error);
    return 0;
  }
}

/**
 * Add token usage to localStorage for anonymous users
 */
async function addLocalTokenUsage(tokens: number): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const currentDate = getCurrentDate();
    const existingTokens = await getLocalTokenUsage();
    const newTotal = existingTokens + tokens;

    const data = {
      date: currentDate,
      tokensUsed: newTotal,
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing local token usage:", error);
  }
}

interface UsageData {
  tokensUsed: number;
  isAuthenticated: boolean;
  dailyLimit: number; // in tokens
  hasActiveSubscription: boolean;
  planName?: string;
  isTestUser: boolean;
}

type ModelName = "gpt-4" | "gpt-3.5-turbo";

/**
 * Calculate percentage of daily limit used
 */
export function calculateUsagePercentage(
  tokensUsed: number,
  dailyLimit: number
): number {
  return Math.min(100, Math.round((tokensUsed / dailyLimit) * 100));
}

/**
 * Get the current user and their usage data
 */
export async function getUserUsageData(): Promise<UsageData> {
  const supabase = createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Anonymous user - use token-based localStorage tracking
      const tokensUsed = await getLocalTokenUsage();
      return {
        tokensUsed,
        isAuthenticated: false,
        dailyLimit: ANONYMOUS_DAILY_TOKEN_LIMIT,
        hasActiveSubscription: false,
        isTestUser: false,
      };
    }

    // Check for active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("plan_name, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subscriptionError) {
      console.warn("Error fetching subscription data:", {
        message: subscriptionError.message,
        code: subscriptionError.code,
        details: subscriptionError.details,
        hint: subscriptionError.hint,
        userId: user.id,
      });
    }

    const hasActiveSubscription = !!subscription;
    const dailyLimit =
      hasActiveSubscription || isTestUser(user.id)
        ? UNLIMITED_DAILY_TOKEN_LIMIT
        : AUTHENTICATED_DAILY_TOKEN_LIMIT;

    // Authenticated user - use Supabase with current date
    const today = getCurrentDate();

    // Get or create today's usage record
    const { data: usage, error } = await supabase
      .from("daily_usage")
      .select("tokens_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Error fetching usage data:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error,
      });
      // Handle RLS permission errors (406) and other database errors
      // Fallback to 0 if there's an error
      return {
        tokensUsed: 0,
        isAuthenticated: true,
        dailyLimit,
        hasActiveSubscription,
        planName: subscription?.plan_name,
        isTestUser: isTestUser(user.id),
      };
    }

    return {
      tokensUsed: usage?.tokens_used || 0,
      isAuthenticated: true,
      dailyLimit,
      hasActiveSubscription,
      planName: subscription?.plan_name,
      isTestUser: isTestUser(user.id),
    };
  } catch (error) {
    console.warn("Error in getUserUsageData:", error);
    // Fallback to anonymous usage
    const tokensUsed = await getLocalTokenUsage();

    return {
      tokensUsed,
      isAuthenticated: false,
      dailyLimit: ANONYMOUS_DAILY_TOKEN_LIMIT,
      hasActiveSubscription: false,
      isTestUser: false,
    };
  }
}

/**
 * Add tokens to the user's daily usage
 */
export async function addTokenUsage(tokens: number): Promise<void> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Anonymous user - use token-based localStorage
      await addLocalTokenUsage(tokens);
      return;
    }

    // Authenticated user - use Supabase with current date
    const today = getCurrentDate();

    // First, try to get existing usage
    const { data: existingUsage, error: selectError } = await supabase
      .from("daily_usage")
      .select("tokens_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.warn("Error fetching existing usage:", selectError);
      // Fallback to localStorage
      await addLocalTokenUsage(tokens);
      return;
    }

    const existingTokens = existingUsage?.tokens_used || 0;
    const newTotal = existingTokens + tokens;

    // Upsert with the new total
    const { error } = await supabase.from("daily_usage").upsert(
      {
        user_id: user.id,
        date: today,
        tokens_used: newTotal,
      },
      {
        onConflict: "user_id,date",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.warn("Error updating usage in Supabase:", error);
      // Fallback to localStorage
      await addLocalTokenUsage(tokens);
    }
  } catch (error) {
    console.warn("Error in addTokenUsage:", error);
    // Fallback to localStorage
    await addLocalTokenUsage(tokens);
  }
}

/**
 * Legacy function for backward compatibility - now uses token-based tracking
 */
export async function addCostUsage(
  tokens: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _model?: ModelName
): Promise<void> {
  await addTokenUsage(tokens);
}

/**
 * Check if the user has reached their daily token limit
 */
export async function isTokenLimitReached(): Promise<boolean> {
  const { tokensUsed, dailyLimit } = await getUserUsageData();
  return tokensUsed >= dailyLimit;
}

/**
 * Check if a request would exceed the daily token limit
 */
export async function wouldExceedTokenLimit(
  estimatedTokens: number
): Promise<boolean> {
  const { tokensUsed, dailyLimit } = await getUserUsageData();
  return tokensUsed + estimatedTokens > dailyLimit;
}

/**
 * Get the remaining tokens for today
 */
export async function getRemainingTokens(): Promise<number> {
  const { tokensUsed, dailyLimit } = await getUserUsageData();
  return Math.max(0, dailyLimit - tokensUsed);
}

/**
 * Get the daily token limit for the current user
 */
export async function getDailyTokenLimit(): Promise<number> {
  const { dailyLimit } = await getUserUsageData();
  return dailyLimit;
}

/**
 * Get usage percentage (0-100)
 */
export async function getUsagePercentage(): Promise<number> {
  const { tokensUsed, dailyLimit } = await getUserUsageData();
  return calculateUsagePercentage(tokensUsed, dailyLimit);
}

/**
 * Get user authentication status and benefits
 */
export async function getUserStatus(): Promise<{
  isAuthenticated: boolean;
  dailyLimit: number;
  tokensUsed: number;
  remainingTokens: number;
  usagePercentage: number;
  hasActiveSubscription: boolean;
  planName?: string;
  isTestUser: boolean;
}> {
  const data = await getUserUsageData();
  const remainingTokens = Math.max(0, data.dailyLimit - data.tokensUsed);
  const usagePercentage = calculateUsagePercentage(
    data.tokensUsed,
    data.dailyLimit
  );

  return {
    ...data,
    remainingTokens,
    usagePercentage,
  };
}
