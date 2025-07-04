import { createClient } from "@/lib/supabase/client";
import { getTokenUsage as getLocalTokenUsage, addTokenUsage as addLocalTokenUsage } from "@/lib/usageClient";

// Usage limits
const ANONYMOUS_DAILY_TOKEN_LIMIT = 1500;
const AUTHENTICATED_DAILY_TOKEN_LIMIT = 3000;

interface UsageData {
  tokensUsed: number;
  isAuthenticated: boolean;
  dailyLimit: number;
}

/**
 * Get the current user and their usage data
 */
export async function getUserUsageData(): Promise<UsageData> {
  const supabase = createClient();
  
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Anonymous user - use localStorage
      const tokens = await getLocalTokenUsage();
      
      return {
        tokensUsed: tokens,
        isAuthenticated: false,
        dailyLimit: ANONYMOUS_DAILY_TOKEN_LIMIT,
      };
    }

    // Authenticated user - use Supabase
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create today's usage record
    const { data: usage, error } = await supabase
      .from('daily_usage')
      .select('tokens_used')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching usage data:', error);
      // Fallback to 0 if there's an error
      return {
        tokensUsed: 0,
        isAuthenticated: true,
        dailyLimit: AUTHENTICATED_DAILY_TOKEN_LIMIT,
      };
    }

    return {
      tokensUsed: usage?.tokens_used || 0,
      isAuthenticated: true,
      dailyLimit: AUTHENTICATED_DAILY_TOKEN_LIMIT,
    };
  } catch (error) {
    console.warn('Error in getUserUsageData:', error);
    // Fallback to anonymous usage
    const tokens = await getLocalTokenUsage();
    
    return {
      tokensUsed: tokens,
      isAuthenticated: false,
      dailyLimit: ANONYMOUS_DAILY_TOKEN_LIMIT,
    };
  }
}

/**
 * Add tokens to the user's daily usage
 */
export async function addTokenUsage(tokens: number): Promise<void> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Anonymous user - use localStorage
      await addLocalTokenUsage(tokens);
      return;
    }

    // Authenticated user - use Supabase
    const today = new Date().toISOString().split('T')[0];
    
    // First, try to get existing usage
    const { data: existingUsage, error: selectError } = await supabase
      .from('daily_usage')
      .select('tokens_used')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Error fetching existing usage:', selectError);
      // Fallback to localStorage
      await addLocalTokenUsage(tokens);
      return;
    }

    const newTotal = (existingUsage?.tokens_used || 0) + tokens;

    // Upsert with the new total
    const { error } = await supabase
      .from('daily_usage')
      .upsert({
        user_id: user.id,
        date: today,
        tokens_used: newTotal,
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.warn('Error updating usage in Supabase:', error);
      // Fallback to localStorage
      await addLocalTokenUsage(tokens);
    }
  } catch (error) {
    console.warn('Error in addTokenUsage:', error);
    // Fallback to localStorage
    await addLocalTokenUsage(tokens);
  }
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
export async function wouldExceedTokenLimit(estimatedTokens: number): Promise<boolean> {
  const { tokensUsed, dailyLimit } = await getUserUsageData();
  return (tokensUsed + estimatedTokens) > dailyLimit;
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
 * Get user authentication status and benefits
 */
export async function getUserStatus(): Promise<{
  isAuthenticated: boolean;
  dailyLimit: number;
  tokensUsed: number;
  remainingTokens: number;
}> {
  const data = await getUserUsageData();
  return {
    ...data,
    remainingTokens: Math.max(0, data.dailyLimit - data.tokensUsed),
  };
}