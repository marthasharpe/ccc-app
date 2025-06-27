/**
 * Utility functions to detect and parse paragraph number queries
 */

export interface ParagraphQuery {
  isParagraphQuery: boolean
  reference?: string // "1234" or "1234-1236"
  startNumber?: number
  endNumber?: number
}

/**
 * Detects if a search query is asking for a specific CCC paragraph number
 * Matches patterns like: "1234", "CCC 1234", "paragraph 1234", "1234-1236", etc.
 */
export function detectParagraphQuery(query: string): ParagraphQuery {
  const trimmedQuery = query.trim()
  console.log('Detecting paragraph query for:', `"${trimmedQuery}"`)
  
  // Pattern 1: Pure number (e.g., "1234")
  const pureNumberMatch = trimmedQuery.match(/^(\d+)$/)
  if (pureNumberMatch) {
    const num = parseInt(pureNumberMatch[1])
    console.log('Pure number match:', num, 'valid:', num >= 1 && num <= 2865)
    if (num >= 1 && num <= 2865) {
      return {
        isParagraphQuery: true,
        reference: num.toString(),
        startNumber: num,
        endNumber: num
      }
    }
  }

  // Pattern 2: Range (e.g., "1234-1236", "1234 - 1236")
  const rangeMatch = trimmedQuery.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    
    console.log('Range match found:', { start, end, valid: start >= 1 && end <= 2865 && start <= end && (end - start) <= 9 })
    
    if (start >= 1 && end <= 2865 && start <= end && (end - start) <= 9) {
      return {
        isParagraphQuery: true,
        reference: `${start}-${end}`,
        startNumber: start,
        endNumber: end
      }
    }
  }

  // Pattern 3: With CCC prefix (e.g., "CCC 1234", "ccc 1234-1236")
  const cccMatch = trimmedQuery.match(/^ccc\s+(\d+)(?:\s*-\s*(\d+))?$/i)
  if (cccMatch) {
    const start = parseInt(cccMatch[1])
    const end = cccMatch[2] ? parseInt(cccMatch[2]) : start
    
    if (start >= 1 && end <= 2865 && start <= end && (end - start) <= 9) {
      const reference = start === end ? start.toString() : `${start}-${end}`
      return {
        isParagraphQuery: true,
        reference,
        startNumber: start,
        endNumber: end
      }
    }
  }

  // Pattern 4: With "paragraph" prefix (e.g., "paragraph 1234", "para 1234-1236")
  const paragraphMatch = trimmedQuery.match(/^(?:paragraph|para|p)\s+(\d+)(?:\s*-\s*(\d+))?$/i)
  if (paragraphMatch) {
    const start = parseInt(paragraphMatch[1])
    const end = paragraphMatch[2] ? parseInt(paragraphMatch[2]) : start
    
    if (start >= 1 && end <= 2865 && start <= end && (end - start) <= 9) {
      const reference = start === end ? start.toString() : `${start}-${end}`
      return {
        isParagraphQuery: true,
        reference,
        startNumber: start,
        endNumber: end
      }
    }
  }

  // Pattern 5: With hash symbol (e.g., "#1234", "#1234-1236")
  const hashMatch = trimmedQuery.match(/^#(\d+)(?:\s*-\s*(\d+))?$/)
  if (hashMatch) {
    const start = parseInt(hashMatch[1])
    const end = hashMatch[2] ? parseInt(hashMatch[2]) : start
    
    if (start >= 1 && end <= 2865 && start <= end && (end - start) <= 9) {
      const reference = start === end ? start.toString() : `${start}-${end}`
      return {
        isParagraphQuery: true,
        reference,
        startNumber: start,
        endNumber: end
      }
    }
  }

  console.log('No paragraph pattern matched, treating as regular search')
  return { isParagraphQuery: false }
}

/**
 * Simple check if query looks like a paragraph number
 */
export function isParagraphNumberQuery(query: string): boolean {
  return detectParagraphQuery(query).isParagraphQuery
}

/**
 * Extract reference string from paragraph query
 */
export function extractParagraphReference(query: string): string | null {
  const result = detectParagraphQuery(query)
  return result.isParagraphQuery ? result.reference! : null
}