import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
      dimensions: 1536, // Explicitly set to 1536 for consistency
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate chat response using Catholic catechism assistant
 */
export async function generateChatResponse(
  userQuestion: string,
  model: "gpt-4" | "gpt-3.5-turbo" = "gpt-3.5-turbo"
): Promise<{ response: string; tokensUsed: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a Catholic catechism assistant.

Your job is to answer questions using only the official teachings of the Catholic Church, especially the Catechism of the Catholic Church (CCC). Your answers must:
• Be faithful to Church doctrine as defined in the CCC.
• Openly acknowledge if a topic is beyond the scope of the Catechism.
• Always use direct quotes from the catechism to support your answers and include exact CCC paragraph numbers in parentheses (e.g. "(CCC 2357)") to encourage deeper study.
• Avoid theological speculation, private opinions, or non-magisterial sources.
• Use clear and gentle language that is appropriate for children, new learners, and catechists.
• Show compassion and understanding, especially when questions touch on sensitive or controversial topics.

When questions use modern, vague, or colloquial language (e.g. "gay marriage," "gender identity," "getting into heaven," "being a good person"), translate them internally into doctrinally precise terms before answering (e.g. "homosexual unions," "the nature of the human person," "salvation," "the moral life").

Always maintain a warm, respectful, and pastoral tone. Avoid cold, legalistic phrasing even when discussing moral norms. Your goal is to teach the truth with love.`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Slightly higher for more natural responses while staying accurate
    });

    const chatResponse = response.choices[0]?.message?.content?.trim();

    if (!chatResponse) {
      throw new Error("OpenAI returned empty response");
    }

    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      response: chatResponse,
      tokensUsed,
    };
  } catch (error) {
    console.error("Chat response error:", error);
    throw new Error(
      `Failed to generate chat response: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Rewrite user queries into theologically precise phrasing optimized for Catechism search
 * Uses GPT-3.5-turbo for fast, cost-effective query optimization
 */
export async function rewriteQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Rewrite the following question into a single, concise sentence using theologically precise language from official Catholic doctrine.
	•	Replace modern or colloquial terms with doctrinal equivalents (e.g., “gay marriage” → “homosexual unions”).
	•	Omit vague references to Church authority, teaching, or nature unless they are the main subject.
	•	Focus on the core doctrinal subject, not the question format (e.g., strip “What does the Church teach about…”).
	•	Output only a single sentence, under 20 words, that captures the doctrinal topic as directly as possible.
	•	Do not include synonyms, alternative phrasings, or logical operators like “or.”

Return only the final sentence, with no commentary.
`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 50, // Keep responses short and focused
      temperature: 0.2, // Low temperature for consistent, precise rewrites
    });

    const rewrittenQuery = response.choices[0]?.message?.content?.trim();

    if (!rewrittenQuery) {
      throw new Error("OpenAI returned empty response");
    }

    return rewrittenQuery;
  } catch (error) {
    console.error("Query rewrite error:", error);
    throw new Error(
      `Failed to rewrite query: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
