import { synonymMap } from './synonyms'

/**
 * Expands a user query by adding formal CCC terminology as alternatives
 * Creates multiple query variants using synonym substitution and combines them with OR
 * 
 * @param query - The original user query
 * @returns Expanded query string with synonyms, or original query if no matches
 */
export function expandQuery(query: string): string {
  const originalQuery = query.trim()
  const lowerQuery = originalQuery.toLowerCase()
  
  // Track all query variants (start with original)
  const queryVariants: string[] = [originalQuery]
  
  // Check for synonym matches (case-insensitive)
  for (const [term, synonyms] of Object.entries(synonymMap)) {
    const lowerTerm = term.toLowerCase()
    
    // Check if the term appears in the query
    if (lowerQuery.includes(lowerTerm)) {
      // Create variants by substituting each synonym
      for (const synonym of synonyms) {
        // Create case-insensitive replacement
        const regex = new RegExp(escapeRegExp(lowerTerm), 'gi')
        const variantQuery = originalQuery.replace(regex, synonym)
        
        // Only add if it's actually different from original
        if (variantQuery !== originalQuery) {
          queryVariants.push(variantQuery)
        }
      }
    }
  }
  
  // If we found synonyms, combine all variants with OR
  if (queryVariants.length > 1) {
    return queryVariants.join(' OR ')
  }
  
  // Return original query if no synonyms found
  return originalQuery
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * For debugging - shows what expansions would be made without actually expanding
 */
export function previewExpansion(query: string): {
  originalQuery: string
  matchedTerms: string[]
  expandedQuery: string
  hasExpansion: boolean
} {
  const originalQuery = query.trim()
  const expandedQuery = expandQuery(query)
  const lowerQuery = originalQuery.toLowerCase()
  
  const matchedTerms: string[] = []
  
  // Find which terms matched
  for (const term of Object.keys(synonymMap)) {
    if (lowerQuery.includes(term.toLowerCase())) {
      matchedTerms.push(term)
    }
  }
  
  return {
    originalQuery,
    matchedTerms,
    expandedQuery,
    hasExpansion: expandedQuery !== originalQuery
  }
}