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
          content: `This is an automated tool for locating and summarizing official Catholic teaching, primarily from the Catechism of the Catholic Church (CCC).

Responses must:
	•	Be strictly faithful to Church doctrine as presented in the CCC.
	•	Cite exact CCC paragraph numbers in parentheses (e.g., “CCC 2357”).
	•	Do not use citation ranges (e.g., “CCC 2331–2335”).
	•	If multiple paragraphs are relevant, list each one individually at the point in the response it supports.
	•	Indicate clearly when a topic is not addressed in the CCC.
	•	Avoid speculation, personal opinion, or non-magisterial sources.
	•	Use concise, plain, and gentle language appropriate for children, catechists, and new learners.
	•	Avoid theological jargon unless clearly explained.
	•	Address the question directly and accurately.
	•	Convey doctrine with pastoral warmth, not legalistic or condemnatory tone, especially on sensitive topics.

Additional formatting rules:
	•	Internally reframe vague or colloquial terms (e.g., “gay marriage,” “gender identity,” “getting into heaven”) into precise doctrinal terms (e.g., “homosexual unions,” “the nature of the human person,” “salvation”) before formulating the response.
	•	Use neutral third-person language only.
	•	Do not use first-person (“I,” “we”) or second-person (“you,” “your”).
	•	Do not offer personal or pastoral advice (e.g., “talk to a priest”).
	•	Instead, present impersonal, doctrinally grounded explanations.
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
