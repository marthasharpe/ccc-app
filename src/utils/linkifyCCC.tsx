import React from 'react'

interface LinkifyCCCProps {
  text: string
  onCCCClick: (reference: string) => void
}

/**
 * Converts CCC paragraph references in text to clickable links
 * Matches patterns like: (CCC 1234), CCC 1234, (CCC 1234-1236), and bare numbers in parentheses like (1234)
 */
export function LinkifyCCC({ text, onCCCClick }: LinkifyCCCProps) {
  // Combined regex to match both CCC references and bare paragraph numbers in parentheses
  const combinedRegex = /(\(?(CCC\s+(\d+)(?:-\d+)?)\)?|\((\d{1,4})\))/gi

  const parts = []
  let lastIndex = 0
  let match

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    let numberPart: string
    let beforeText = ''
    let clickableText = ''
    let afterText = ''

    if (match[2]) {
      // CCC reference match (group 2 contains "CCC 1234" or "CCC 1234-1236")
      const fullReference = match[2].replace('CCC ', '') // "1234" or "1234-1236"
      // For ranges, extract just the first number
      numberPart = fullReference.includes('-') ? fullReference.split('-')[0] : fullReference
      
      // Check if the match has parentheses around it
      if (match[0].startsWith('(') && match[0].endsWith(')')) {
        beforeText = '('
        clickableText = match[2] // "CCC 1234"
        afterText = ')'
      } else {
        clickableText = match[2] // "CCC 1234"
      }
    } else if (match[4]) {
      // Bare number in parentheses match (group 4 contains just the number)
      const num = parseInt(match[4])
      // Only convert if it's a valid CCC paragraph number (1-2865)
      if (num >= 1 && num <= 2865) {
        numberPart = match[4]
        beforeText = '('
        clickableText = match[4] // Just the number
        afterText = ')'
      } else {
        // Not a valid paragraph number, treat as regular text
        parts.push(match[0])
        lastIndex = match.index + match[0].length
        continue
      }
    } else {
      // Shouldn't happen, but fallback to regular text
      parts.push(match[0])
      lastIndex = match.index + match[0].length
      continue
    }

    // Add the parts: non-clickable text before, clickable link, non-clickable text after
    if (beforeText) {
      parts.push(beforeText)
    }
    
    parts.push(
      <button
        key={`ccc-${match.index}`}
        onClick={() => onCCCClick(numberPart)}
        className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
        style={{
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
        }}
        title={`Click to read CCC ${numberPart}`}
      >
        {clickableText}
      </button>
    )
    
    if (afterText) {
      parts.push(afterText)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <span>{parts}</span>
}

/**
 * Simple function to check if text contains CCC references or bare paragraph numbers
 */
export function hasCCCReferences(text: string): boolean {
  const combinedRegex = /(\(?(CCC\s+\d+(?:-\d+)?)\)?|\((\d{1,4})\))/i
  const match = combinedRegex.exec(text)
  
  if (!match) return false
  
  // If it's a CCC reference, it's valid
  if (match[2]) return true
  
  // If it's a bare number in parentheses, check if it's a valid paragraph number
  if (match[3]) {
    const num = parseInt(match[3])
    return num >= 1 && num <= 2865
  }
  
  return false
}