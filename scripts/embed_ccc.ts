import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Load environment variables
config({ path: ".env.local" });

// Validation schemas
const CCCParagraphSchema = z.object({
  paragraph_number: z.number(),
  content: z.string(),
});

const CCCDataSchema = z.array(CCCParagraphSchema);

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error("Missing required environment variables:");
  console.error("- SUPABASE_URL:", !!supabaseUrl);
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  console.error("- OPENAI_API_KEY:", !!openaiApiKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

async function generateEmbedding(text: string): Promise<number[]> {
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
    throw error;
  }
}

async function insertParagraph(paragraph: z.infer<typeof CCCParagraphSchema>) {
  try {
    console.log(`Processing paragraph ${paragraph.paragraph_number}...`);

    // Generate embedding for the content
    const embedding = await generateEmbedding(paragraph.content);

    // Insert into Supabase with ON CONFLICT DO NOTHING behavior
    const { data, error } = await supabase
      .from("ccc_paragraphs")
      .upsert(
        {
          paragraph_number: paragraph.paragraph_number,
          content: paragraph.content,
          embedding: embedding,
        },
        {
          onConflict: "paragraph_number",
          ignoreDuplicates: true,
        }
      )
      .select();

    if (error) {
      console.error(
        `Error inserting paragraph ${paragraph.paragraph_number}:`,
        error
      );
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Inserted paragraph ${paragraph.paragraph_number}`);
    } else {
      console.log(
        `⏭️  Skipped paragraph ${paragraph.paragraph_number} (already exists)`
      );
    }
  } catch (error) {
    console.error(
      `Failed to process paragraph ${paragraph.paragraph_number}:`,
      error
    );
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting CCC embedding process...");

    // Load and validate the CCC data
    const cccFilePath = join(__dirname, "ccc.json");
    const cccRawData = readFileSync(cccFilePath, "utf8");
    const cccData = JSON.parse(cccRawData);

    // Transform data from {id, text} to {paragraph_number, content}
    const transformedData = cccData.map((item: any) => ({
      paragraph_number: item.id,
      content: item.text
    }));

    // Validate the data structure
    const validatedData = CCCDataSchema.parse(transformedData);
    console.log(`📖 Loaded ${validatedData.length} CCC paragraphs`);

    // Process each paragraph
    let processed = 0;
    let skipped = 0;

    for (const paragraph of validatedData) {
      try {
        // Check if paragraph already exists
        const { data: existing, error: checkError } = await supabase
          .from("ccc_paragraphs")
          .select("id")
          .eq("paragraph_number", paragraph.paragraph_number)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is expected for new records
          throw checkError;
        }

        if (existing) {
          console.log(
            `⏭️  Paragraph ${paragraph.paragraph_number} already exists, skipping...`
          );
          skipped++;
          continue;
        }

        await insertParagraph(paragraph);
        processed++;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `❌ Failed to process paragraph ${paragraph.paragraph_number}:`,
          error
        );
        // Continue with other paragraphs even if one fails
      }
    }

    console.log("✨ Embedding process completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total paragraphs: ${validatedData.length}`);
    console.log(`   - Processed: ${processed}`);
    console.log(`   - Skipped (already existed): ${skipped}`);
    console.log(`   - Failed: ${validatedData.length - processed - skipped}`);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
