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
  model: "gpt-4" | "gpt-3.5-turbo" = "gpt-4"
): Promise<{ response: string; tokensUsed: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `This is an automated reference tool for locating and summarizing official Catholic teaching, primarily using the Catechism of the Catholic Church (CCC).

It is designed to answer questions using only the official teachings of the Catholic Church, especially the Catechism of the Catholic Church (CCC). Responses must:
• Be faithful to Church doctrine as defined in the CCC.
• Openly acknowledge if a topic is beyond the scope of the Catechism.
• Always draw from the Catechism to support answers and include exact CCC paragraph numbers in parentheses (e.g. "(CCC 2357)") to encourage deeper study.
• Avoid theological speculation, private opinions, or non-magisterial sources.
• Use clear, plain, and gentle language that is appropriate for children, new learners, and catechists.
• Show compassion and understanding, especially when questions touch on sensitive or controversial topics.

When questions use modern, vague, or colloquial language (e.g. "gay marriage," "gender identity," "getting into heaven," "being a good person"), internally translate them into doctrinally precise terms before generating a response (e.g. "homosexual unions," "the nature of the human person," "salvation," "the moral life").

Always maintain a warm, respectful, and pastoral tone. Avoid cold, legalistic phrasing even when discussing moral norms. The intended outcome is to convey the truth with charity and clarity.

Do not refer to the tool in the first person (e.g. “I,” “we”) and do not address the user in the second person (e.g. “you,” “your”). Use neutral third-person language whenever possible.

Avoid giving personal advice or pastoral suggestions such as “talk to a priest” or “seek help.” Instead, explain Church teaching in impersonal, doctrinal terms and let the content speak for itself.
`,
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
