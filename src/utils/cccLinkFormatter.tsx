import React from "react";

interface CCCLinkFormatterProps {
  text: string;
  onCCCClick: (reference: string) => void;
}

interface MatchObject {
  type: 'ccc-comma' | 'ccc-range' | 'ccc-single' | 'bare-numbers';
  match: RegExpExecArray;
  numbers?: number[];
  segments?: Array<{type: 'single', number: number} | {type: 'range', start: number, end: number}>;
  startNum?: number;
  endNum?: number;
  index: number;
  length: number;
}

/**
 * Unified utility function for formatting CCC paragraph references into clickable links.
 * Handles all CCC reference patterns:
 * - CCC 123 (with or without parentheses)
 * - (123) - bare numbers in parentheses
 * - 123, 234, 345 - comma-separated numbers
 * - 123-125 - ranges of numbers
 * - Any combination of the above
 */
export function formatCCCLinks({ text, onCCCClick }: CCCLinkFormatterProps) {
  // Simpler approach: handle different patterns separately
  const parts = [];
  let lastIndex = 0;
  
  // Pattern 1: CCC followed by comma-separated numbers and ranges (with optional parentheses)
  const cccCommaRegex = /(\(?)CCC\s+((?:\d{1,4}(?:-\d{1,4})?(?:\s*,\s*)?)+)([\)]?)/gi;
  // Pattern 2: CCC followed by single number or range (with optional parentheses)  
  const cccSingleRegex = /(\(?)CCC\s+(\d+)(?:-(\d+))?([\)]?)/gi;
  // Pattern 3: Bare numbers in parentheses
  const bareNumberRegex = /\((\d{1,4}(?:\s*,\s*\d{1,4})*)\)/gi;
  
  // Process all patterns together
  const allMatches: MatchObject[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = cccCommaRegex.exec(text)) !== null) {
    const segments = match[2].split(',').map(s => s.trim());
    if (segments.length > 1) {
      // Parse each segment - could be a single number or a range
      const parsedSegments = segments.map(segment => {
        if (segment.includes('-')) {
          const [start, end] = segment.split('-').map(n => parseInt(n.trim()));
          return { type: 'range' as const, start, end };
        } else {
          return { type: 'single' as const, number: parseInt(segment) };
        }
      });
      
      // Validate all numbers are in valid CCC range
      const allValid = parsedSegments.every(seg => 
        seg.type === 'single' 
          ? seg.number >= 1 && seg.number <= 2865
          : seg.start >= 1 && seg.start <= 2865 && seg.end >= 1 && seg.end <= 2865
      );
      
      if (allValid) {
        allMatches.push({
          type: 'ccc-comma',
          match: match,
          segments: parsedSegments,
          index: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  cccSingleRegex.lastIndex = 0;
  while ((match = cccSingleRegex.exec(text)) !== null) {
    const startNum = parseInt(match[2]);
    const endNum = match[3] ? parseInt(match[3]) : null;
    if (startNum >= 1 && startNum <= 2865 && (!endNum || (endNum >= 1 && endNum <= 2865))) {
      // Check if this overlaps with a comma match
      const overlaps = allMatches.some(m => 
        match!.index >= m.index && match!.index < m.index + m.length
      );
      if (!overlaps) {
        allMatches.push({
          type: endNum ? 'ccc-range' : 'ccc-single',
          match: match,
          startNum: startNum,
          endNum: endNum || undefined,
          index: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  while ((match = bareNumberRegex.exec(text)) !== null) {
    const numbers = match[1].split(',').map(n => parseInt(n.trim()));
    if (numbers.every(num => num >= 1 && num <= 2865)) {
      // Check if this overlaps with existing matches
      const overlaps = allMatches.some(m => 
        match!.index >= m.index && match!.index < m.index + m.length
      );
      if (!overlaps) {
        allMatches.push({
          type: 'bare-numbers',
          match: match,
          numbers: numbers,
          index: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  // Sort matches by index
  allMatches.sort((a, b) => a.index - b.index);
  
  // Process matches in order
  for (const matchObj of allMatches) {
    // Add text before this match
    if (matchObj.index > lastIndex) {
      parts.push(text.slice(lastIndex, matchObj.index));
    }
    
    if (matchObj.type === 'ccc-comma') {
      const { match, segments } = matchObj;
      if (match[1]) parts.push('(');
      
      for (let i = 0; i < segments!.length; i++) {
        const segment = segments![i];
        if (segment.type === 'single') {
          parts.push(
            <button
              key={`ccc-comma-${matchObj.index}-${i}`}
              onClick={() => onCCCClick(segment.number.toString())}
              className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
              style={buttonStyles}
              title={`Click to read CCC ${segment.number}`}
            >
              {i === 0 ? `CCC ${segment.number}` : segment.number}
            </button>
          );
        } else {
          // Range segment - single link that goes to the first number
          parts.push(
            <button
              key={`ccc-comma-range-${matchObj.index}-${i}`}
              onClick={() => onCCCClick(segment.start.toString())}
              className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
              style={buttonStyles}
              title={`Click to read CCC ${segment.start}`}
            >
              {i === 0 ? `CCC ${segment.start}-${segment.end}` : `${segment.start}-${segment.end}`}
            </button>
          );
        }
        if (i < segments!.length - 1) parts.push(', ');
      }
      
      if (match[3]) parts.push(match[3]);
    } else if (matchObj.type === 'ccc-range') {
      const { match, startNum, endNum } = matchObj;
      if (match[1]) parts.push('(');
      
      parts.push(
        <button
          key={`ccc-range-${matchObj.index}`}
          onClick={() => onCCCClick(startNum!.toString())}
          className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
          style={buttonStyles}
          title={`Click to read CCC ${startNum}`}
        >
          CCC {startNum}-{endNum}
        </button>
      );
      
      if (match[4]) parts.push(match[4]);
    } else if (matchObj.type === 'ccc-single') {
      const { match, startNum } = matchObj;
      if (match[1]) parts.push('(');
      
      parts.push(
        <button
          key={`ccc-single-${matchObj.index}`}
          onClick={() => onCCCClick(startNum!.toString())}
          className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
          style={buttonStyles}
          title={`Click to read CCC ${startNum}`}
        >
          CCC {startNum}
        </button>
      );
      
      if (match[4]) parts.push(match[4]);
    } else if (matchObj.type === 'bare-numbers') {
      const { numbers } = matchObj;
      parts.push('(');
      
      for (let i = 0; i < numbers!.length; i++) {
        parts.push(
          <button
            key={`bare-${matchObj.index}-${i}`}
            onClick={() => onCCCClick(numbers![i].toString())}
            className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
            style={buttonStyles}
            title={`Click to read CCC ${numbers![i]}`}
          >
            {numbers![i]}
          </button>
        );
        if (i < numbers!.length - 1) parts.push(', ');
      }
      
      parts.push(')');
    }
    
    lastIndex = matchObj.index + matchObj.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span>{parts}</span>;
}

/**
 * Checks if text contains any CCC references that would be processed by formatCCCLinks
 */
export function hasCCCReferences(text: string): boolean {
  // Check for CCC comma-separated numbers and ranges
  const cccCommaRegex = /(\(?)CCC\s+((?:\d{1,4}(?:-\d{1,4})?(?:\s*,\s*)?)+)([\)]?)/i;
  const cccCommaMatch = cccCommaRegex.exec(text);
  if (cccCommaMatch) {
    const segments = cccCommaMatch[2].split(',').map(s => s.trim());
    if (segments.length > 1) {
      const parsedSegments = segments.map(segment => {
        if (segment.includes('-')) {
          const [start, end] = segment.split('-').map(n => parseInt(n.trim()));
          return { type: 'range' as const, start, end };
        } else {
          return { type: 'single' as const, number: parseInt(segment) };
        }
      });
      
      const allValid = parsedSegments.every(seg => 
        seg.type === 'single' 
          ? seg.number >= 1 && seg.number <= 2865
          : seg.start >= 1 && seg.start <= 2865 && seg.end >= 1 && seg.end <= 2865
      );
      
      if (allValid) {
        return true;
      }
    }
  }
  
  // Check for CCC single numbers or ranges
  const cccSingleRegex = /(\(?)CCC\s+(\d+)(?:-(\d+))?([\)]?)/i;
  const cccSingleMatch = cccSingleRegex.exec(text);
  if (cccSingleMatch) {
    const startNum = parseInt(cccSingleMatch[2]);
    const endNum = cccSingleMatch[3] ? parseInt(cccSingleMatch[3]) : null;
    if (startNum >= 1 && startNum <= 2865 && (!endNum || (endNum >= 1 && endNum <= 2865))) {
      return true;
    }
  }
  
  // Check for bare numbers in parentheses
  const bareNumberRegex = /\((\d{1,4}(?:\s*,\s*\d{1,4})*)\)/i;
  const bareMatch = bareNumberRegex.exec(text);
  if (bareMatch) {
    const numbers = bareMatch[1].split(',').map(n => parseInt(n.trim()));
    if (numbers.every(num => num >= 1 && num <= 2865)) {
      return true;
    }
  }
  
  return false;
}

// Common button styles to ensure consistency
const buttonStyles: React.CSSProperties = {
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'none',
  display: 'inline',
  font: 'inherit',
  lineHeight: 'inherit',
  verticalAlign: 'baseline',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  textDecoration: 'inherit',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  minHeight: 'auto',
  height: 'auto'
};