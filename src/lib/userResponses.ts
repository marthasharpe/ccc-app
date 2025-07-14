import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SaveResponseParams {
  userId: string;
  prompt: string;
  response: string;
  tokensUsed: number;
}

export interface UserResponse {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
  similarity?: number;
}

/**
 * Save a GPT response with embedding to the database
 */
export async function saveUserResponse({
  userId,
  prompt,
  response,
  tokensUsed,
}: SaveResponseParams): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // Generate embedding for the response
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: response,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Save to Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_responses")
      .insert({
        user_id: userId,
        prompt,
        response,
        tokens_used: tokensUsed,
        embedding,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving user response:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error in saveUserResponse:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save response" 
    };
  }
}

/**
 * Get recent responses for a user
 */
export async function getRecentUserResponses(
  userId: string,
  limit: number = 20
): Promise<{ success: boolean; data?: UserResponse[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_responses")
      .select("id, user_id, prompt, response, tokens_used, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent responses:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in getRecentUserResponses:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch responses" 
    };
  }
}