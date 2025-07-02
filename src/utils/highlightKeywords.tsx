import React from 'react';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function HighlightedText({ text, searchQuery, className = '' }: HighlightedTextProps) {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Extract individual words from the search query
  // Remove common words and punctuation, split by spaces
  const keywords = searchQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2) // Only highlight words longer than 2 characters
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'car', 'she', 'use', 'her', 'now', 'oil', 'sit', 'way', 'who', 'box', 'boy', 'did', 'end', 'few', 'got', 'let', 'old', 'see', 'sun', 'try', 'yet'].includes(word));

  if (keywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create a regex pattern to match any of the keywords (case-insensitive, word boundaries)
  const pattern = new RegExp(
    `\\b(${keywords.map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  // Split the text and highlight matches
  const parts = text.split(pattern);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isKeyword = keywords.some(keyword => 
          part.toLowerCase() === keyword.toLowerCase()
        );
        
        if (isKeyword) {
          return (
            <span
              key={index}
              className="font-bold"
              style={{ color: '#E5A431' }}
            >
              {part}
            </span>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// Helper function to extract keywords from a search query
export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'car', 'she', 'use', 'her', 'now', 'oil', 'sit', 'way', 'who', 'box', 'boy', 'did', 'end', 'few', 'got', 'let', 'old', 'see', 'sun', 'try', 'yet'].includes(word));
}