import React from "react";
import { HighlightedText } from "./highlightKeywords";
import { formatCCCLinks, hasCCCReferences } from "./cccLinkFormatter";

interface FormatCCCContentProps {
  content: string;
  onCCCClick?: (reference: string) => void;
  searchQuery?: string;
}

/**
 * Formats CCC paragraph content with proper styling and links
 * - Text wrapped in ** becomes bold
 * - Text wrapped in * becomes italic
 * - Numbers in parentheses (1234) become clickable links to other paragraphs
 * - Lines starting with > become block quotes
 * - Preserves line breaks and other formatting
 */
export function FormatCCCContent({
  content,
  onCCCClick,
  searchQuery,
}: FormatCCCContentProps) {
  // First, split content by lines to handle block quotes
  const lines = content.split("\n");
  const processedElements: (string | React.ReactNode)[] = [];

  let currentQuoteLines: string[] = [];
  let currentNormalContent = "";

  const processNormalContent = (text: string) => {
    if (!text.trim()) return [];

    const parts = [];
    let currentIndex = 0;

    // Regex to match bold markers and italic markers only
    // CCC links will be handled separately by the formatCCCLinks utility
    const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

    let match;
    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        const textBefore = text.slice(currentIndex, match.index);
        if (searchQuery) {
          parts.push(
            <HighlightedText
              key={`highlight-${currentIndex}`}
              text={textBefore}
              searchQuery={searchQuery}
            />
          );
        } else {
          parts.push(textBefore);
        }
      }

      if (match[2]) {
        // Bold text match (group 2 contains the text between **)
        parts.push(
          <strong key={`bold-${match.index}`} className="font-bold">
            {searchQuery ? (
              <HighlightedText text={match[2]} searchQuery={searchQuery} />
            ) : (
              match[2]
            )}
          </strong>
        );
      } else if (match[3]) {
        // Italic text match (group 3 contains the text between *)
        parts.push(
          <em key={`italic-${match.index}`} className="italic">
            {searchQuery ? (
              <HighlightedText text={match[3]} searchQuery={searchQuery} />
            ) : (
              match[3]
            )}
          </em>
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text after the last match
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (searchQuery) {
        parts.push(
          <HighlightedText
            key={`highlight-end-${currentIndex}`}
            text={remainingText}
            searchQuery={searchQuery}
          />
        );
      } else {
        parts.push(remainingText);
      }
    }

    return parts;
  };

  const flushCurrentContent = () => {
    if (currentNormalContent.trim()) {
      const formattedParts = processNormalContent(currentNormalContent);
      // Convert line breaks within normal content
      const withBreaks = [];
      for (let i = 0; i < formattedParts.length; i++) {
        const part = formattedParts[i];
        if (typeof part === "string" && part.includes("\n")) {
          const subLines = part.split("\n");
          for (let j = 0; j < subLines.length; j++) {
            if (subLines[j]) {
              withBreaks.push(subLines[j]);
            }
            if (j < subLines.length - 1) {
              withBreaks.push(<br key={`br-normal-${i}-${j}`} />);
            }
          }
        } else {
          withBreaks.push(part);
        }
      }
      processedElements.push(...withBreaks);
      currentNormalContent = "";
    }
  };

  const flushCurrentQuote = () => {
    if (currentQuoteLines.length > 0) {
      const quoteContent = currentQuoteLines.join("\n");
      const formattedQuoteContent = processNormalContent(quoteContent);
      processedElements.push(
        <blockquote
          key={`quote-${processedElements.length}`}
          className="border-l-4 border-muted pl-4 italic text-muted-foreground my-4"
        >
          {formattedQuoteContent}
        </blockquote>
      );
      currentQuoteLines = [];
    }
  };

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith(">")) {
      // This is a quote line - flush any normal content first
      flushCurrentContent();

      // Remove the > and any following whitespace, add to quote
      const quoteLine = line.replace(/^>\s*/, "");
      currentQuoteLines.push(quoteLine);
    } else {
      // This is normal content - flush any quote first
      flushCurrentQuote();

      // Add to normal content with line break if not first line
      if (currentNormalContent && line.trim()) {
        currentNormalContent += "\n" + line;
      } else if (line.trim()) {
        currentNormalContent += line;
      } else if (currentNormalContent) {
        // Empty line in normal content
        currentNormalContent += "\n";
      }
    }
  }

  // Flush any remaining content
  flushCurrentContent();
  flushCurrentQuote();

  // Apply CCC link formatting to the entire processed content if onCCCClick is provided
  if (onCCCClick) {
    // Convert processed elements back to a string for CCC link processing
    const textContent = processedElements
      .map(el => typeof el === 'string' ? el : '')
      .join('');
    
    // If there's text content that might contain CCC references, process it
    if (textContent.trim()) {
      return (
        <span>
          {processedElements.map((element, index) => {
            if (typeof element === 'string') {
              return (
                <span key={`ccc-${index}`}>
                  {formatCCCLinks({ text: element, onCCCClick })}
                </span>
              );
            }
            return React.cloneElement(element as React.ReactElement, { key: index });
          })}
        </span>
      );
    }
  }

  return <span>{processedElements}</span>;
}

/**
 * Simple function to check if content contains formatting that needs processing
 */
export function hasFormattedContent(content: string): boolean {
  return /(\*\*[^*]+\*\*|\*[^*]+\*|^>\s)/.test(content) || 
         hasCCCReferences(content);
}
