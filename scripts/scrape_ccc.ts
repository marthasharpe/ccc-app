import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

interface CCCParagraph {
  paragraph_number: number;
  content: string;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    timeout: 30000,
  });
  return response.data;
}

function cleanContent(content: string): string {
  return content
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/Previous\s*-\s*Next/gi, "") // Remove navigation text
    .replace(/Copyright\s*©.*?/gi, "") // Remove copyright notices
    .replace(/Libreria Editrice Vaticana/gi, "") // Remove publisher name
    .trim();
}

function extractParagraphsFromPage(html: string): CCCParagraph[] {
  const $ = cheerio.load(html);
  const paragraphs: CCCParagraph[] = [];

  // Find all <p> tags
  $("p").each((_, element) => {
    const $p = $(element);

    // Skip paragraphs that contain <b> tags (these are section headers)
    if ($p.find("b").length > 0) {
      return;
    }

    // Get the text content, removing <font> tags (footnotes)
    const $clone = $p.clone();
    $clone.find("font").remove(); // Remove footnote references
    const content = $clone.text().trim();

    // Check if paragraph starts with a number
    const numberMatch = content.match(/^(\d+)\s+([\s\S]+)$/);

    if (numberMatch) {
      const paragraphNumber = parseInt(numberMatch[1]);
      const paragraphContent = numberMatch[2];

      if (
        !isNaN(paragraphNumber) &&
        paragraphNumber > 0 &&
        paragraphContent.length > 20
      ) {
        const cleanedContent = cleanContent(paragraphContent);

        console.log(
          `    Found paragraph ${paragraphNumber}: ${cleanedContent.substring(
            0,
            80
          )}...`
        );

        paragraphs.push({
          paragraph_number: paragraphNumber,
          content: cleanedContent,
        });
      }
    }
  });

  return paragraphs;
}

async function scrapeAllPages(): Promise<CCCParagraph[]> {
  const baseUrl = "https://www.vatican.va/archive/ENG0015/";
  const allParagraphs: CCCParagraph[] = [];

  // Generate page URLs from __P1.HTM to __P60.HTM
  const pageUrls: string[] = [];

  // __P1.HTM to __P9.HTM
  for (let i = 1; i <= 9; i++) {
    pageUrls.push(`${baseUrl}__P${i}.HTM`);
  }

  // __PA.HTM to __PZ.HTM (A=10, B=11, ..., Z=35)
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i); // A-Z
    pageUrls.push(`${baseUrl}__P${letter}.HTM`);
  }

  // __P10.HTM to __P60.HTM
  for (let i = 10; i <= 60; i++) {
    pageUrls.push(`${baseUrl}__P${i}.HTM`);
  }

  console.log(`Will process ${pageUrls.length} pages`);

  for (let i = 0; i < pageUrls.length; i++) {
    const url = pageUrls[i];

    try {
      console.log(`\nProcessing page ${i + 1}/${pageUrls.length}: ${url}`);

      const html = await fetchPage(url);
      const paragraphs = extractParagraphsFromPage(html);

      console.log(`  Found ${paragraphs.length} paragraphs`);

      if (paragraphs.length > 0) {
        allParagraphs.push(...paragraphs);
        const numbers = paragraphs.map((p) => p.paragraph_number);
        console.log(`  Paragraph numbers: ${numbers.join(", ")}`);
      }

      // Add delay to be respectful to the server
      await delay(1000);
    } catch (error) {
      console.error(`Failed to process page: ${url}`, error);
      // Continue with other pages
    }
  }

  // Sort paragraphs by number and remove duplicates
  const uniqueParagraphs = allParagraphs
    .filter(
      (paragraph, index, self) =>
        index ===
        self.findIndex((p) => p.paragraph_number === paragraph.paragraph_number)
    )
    .sort((a, b) => a.paragraph_number - b.paragraph_number);

  return uniqueParagraphs;
}

async function main() {
  try {
    console.log("🚀 Starting Catechism scraping from Vatican website...");

    const paragraphs = await scrapeAllPages();

    console.log(`\n📖 Scraped ${paragraphs.length} unique paragraphs`);

    if (paragraphs.length === 0) {
      console.log(
        "⚠️  No paragraphs found. The HTML structure might have changed."
      );
      return;
    }

    // Write to file
    const outputPath = join(__dirname, "ccc.json");
    writeFileSync(outputPath, JSON.stringify(paragraphs, null, 2));

    console.log(`✅ Saved to ${outputPath}`);

    // Show statistics
    console.log("📊 Statistics:");
    console.log(`   - Total paragraphs: ${paragraphs.length}`);

    if (paragraphs.length > 0) {
      const numbers = paragraphs.map((p) => p.paragraph_number);
      console.log(
        `   - Paragraph number range: ${Math.min(...numbers)} - ${Math.max(
          ...numbers
        )}`
      );

      // Show first few paragraphs as samples
      console.log("\n📝 Sample paragraphs:");
      paragraphs.slice(0, 5).forEach((p) => {
        console.log(
          `   ${p.paragraph_number}: ${p.content.substring(0, 100)}${
            p.content.length > 100 ? "..." : ""
          }`
        );
      });
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
