import { createClient } from "@/lib/supabase/client";

// Model pricing (per 1000 tokens)
const MODEL_PRICING = {
  "gpt-4": 0.04,
  "gpt-3.5-turbo": 0.002,
} as const;

// Daily cost limits (in dollars) - GPT-3.5 only for MVP (GPT-4 visible but disabled)
const ANONYMOUS_DAILY_COST_LIMIT = 0.05; // ~25 GPT-3.5 responses (GPT-4 reserved for pro plans)
const AUTHENTICATED_DAILY_COST_LIMIT = 0.1; // ~50 GPT-3.5 responses (GPT-4 reserved for pro plans)

// Anonymous user storage key
const COST_STORAGE_KEY = "cathcat_daily_cost_usage";

/**
 * Get the current date for daily resets at midnight local time
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get cost usage from localStorage for anonymous users
 */
async function getLocalCostUsage(): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const stored = localStorage.getItem(COST_STORAGE_KEY);
    if (!stored) return 0;

    const data = JSON.parse(stored);
    const currentDate = getCurrentDate();

    // Reset if it's a new day
    if (data.date !== currentDate) {
      localStorage.removeItem(COST_STORAGE_KEY);
      return 0;
    }
    console.log("data.costUsed", data.costUsed);
    return data.costUsed || 0;
  } catch (error) {
    console.warn("Error reading local cost usage:", error);
    return 0;
  }
}

/**
 * Add cost usage to localStorage for anonymous users
 */
async function addLocalCostUsage(cost: number): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const currentDate = getCurrentDate();
    const existingCost = await getLocalCostUsage();
    const newTotal = existingCost + cost;

    const data = {
      date: currentDate,
      costUsed: newTotal,
    };

    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing local cost usage:", error);
  }
}

interface UsageData {
  costUsed: number; // in dollars
  isAuthenticated: boolean;
  dailyLimit: number; // in dollars
}

type ModelName = keyof typeof MODEL_PRICING;

/**
 * Calculate the cost of tokens for a specific model
 */
export function calculateCost(tokens: number, model: ModelName): number {
  return (tokens / 1000) * MODEL_PRICING[model];
}

/**
 * Calculate percentage of daily limit used
 */
export function calculateUsagePercentage(
  costUsed: number,
  dailyLimit: number
): number {
  return Math.min(100, Math.round((costUsed / dailyLimit) * 100));
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
      // Anonymous user - use cost-based localStorage tracking
      const costUsed = await getLocalCostUsage();
      return {
        costUsed,
        isAuthenticated: false,
        dailyLimit: ANONYMOUS_DAILY_COST_LIMIT,
      };
    }

    // Authenticated user - use Supabase with current date
    const today = getCurrentDate();

    // Get or create today's usage record
    const { data: usage, error } = await supabase
      .from("daily_usage")
      .select("cost_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Error fetching usage data:", error);
      // Fallback to 0 if there's an error
      return {
        costUsed: 0,
        isAuthenticated: true,
        dailyLimit: AUTHENTICATED_DAILY_COST_LIMIT,
      };
    }

    return {
      costUsed: usage?.cost_used || 0,
      isAuthenticated: true,
      dailyLimit: AUTHENTICATED_DAILY_COST_LIMIT,
    };
  } catch (error) {
    console.warn("Error in getUserUsageData:", error);
    // Fallback to anonymous usage
    const costUsed = await getLocalCostUsage();

    return {
      costUsed,
      isAuthenticated: false,
      dailyLimit: ANONYMOUS_DAILY_COST_LIMIT,
    };
  }
}

/**
 * Add cost to the user's daily usage
 */
export async function addCostUsage(
  tokens: number,
  model: ModelName
): Promise<void> {
  const cost = calculateCost(tokens, model);
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Anonymous user - use cost-based localStorage
      await addLocalCostUsage(cost);
      return;
    }

    // Authenticated user - use Supabase with current date
    const today = getCurrentDate();

    // First, try to get existing usage
    const { data: existingUsage, error: selectError } = await supabase
      .from("daily_usage")
      .select("cost_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.warn("Error fetching existing usage:", selectError);
      // Fallback to localStorage
      await addLocalCostUsage(cost);
      return;
    }

    const existingCost = existingUsage?.cost_used || 0;
    const newTotal = existingCost + cost;

    // Upsert with the new total
    const { error } = await supabase.from("daily_usage").upsert(
      {
        user_id: user.id,
        date: today,
        cost_used: newTotal,
      },
      {
        onConflict: "user_id,date",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.warn("Error updating usage in Supabase:", error);
      // Fallback to localStorage
      await addLocalCostUsage(cost);
    }
  } catch (error) {
    console.warn("Error in addCostUsage:", error);
    // Fallback to localStorage
    await addLocalCostUsage(cost);
  }
}

/**
 * Legacy function for backward compatibility - now uses cost-based tracking
 */
export async function addTokenUsage(
  tokens: number,
  model: ModelName = "gpt-3.5-turbo"
): Promise<void> {
  await addCostUsage(tokens, model);
}

/**
 * Check if the user has reached their daily cost limit
 */
export async function isTokenLimitReached(): Promise<boolean> {
  const { costUsed, dailyLimit } = await getUserUsageData();
  return costUsed >= dailyLimit;
}

/**
 * Check if a request would exceed the daily cost limit
 */
export async function wouldExceedTokenLimit(
  estimatedTokens: number,
  model: ModelName = "gpt-3.5-turbo"
): Promise<boolean> {
  const { costUsed, dailyLimit } = await getUserUsageData();
  const estimatedCost = calculateCost(estimatedTokens, model);
  return costUsed + estimatedCost > dailyLimit;
}

/**
 * Get the remaining cost for today (in dollars)
 */
export async function getRemainingCost(): Promise<number> {
  const { costUsed, dailyLimit } = await getUserUsageData();
  return Math.max(0, dailyLimit - costUsed);
}

/**
 * Get the daily cost limit for the current user (in dollars)
 */
export async function getDailyCostLimit(): Promise<number> {
  const { dailyLimit } = await getUserUsageData();
  return dailyLimit;
}

/**
 * Get usage percentage (0-100)
 */
export async function getUsagePercentage(): Promise<number> {
  const { costUsed, dailyLimit } = await getUserUsageData();
  return calculateUsagePercentage(costUsed, dailyLimit);
}

/**
 * Get user authentication status and benefits
 */
export async function getUserStatus(): Promise<{
  isAuthenticated: boolean;
  dailyLimit: number;
  costUsed: number;
  remainingCost: number;
  usagePercentage: number;
}> {
  const data = await getUserUsageData();
  const remainingCost = Math.max(0, data.dailyLimit - data.costUsed);
  const usagePercentage = calculateUsagePercentage(
    data.costUsed,
    data.dailyLimit
  );

  return {
    ...data,
    remainingCost,
    usagePercentage,
  };
}
