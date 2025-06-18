'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'

interface SearchResult {
  id: number
  paragraph_number: number
  content: string
  similarity: number
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)
    setQuery(searchQuery)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Search the Catechism</h1>
          <p className="text-muted-foreground">
            Find passages from the Catechism of the Catholic Church
          </p>
        </div>
        
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Searching...</p>
          </div>
        )}

        {query && !isLoading && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {results.length > 0 
                ? `Found ${results.length} results for "${query}"`
                : `No results found for "${query}"`
              }
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result) => (
              <div key={result.id} className="border rounded-lg p-6 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">
                    Paragraph {result.paragraph_number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
                <p className="text-foreground leading-relaxed">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder results for demo */}
        {!query && !isLoading && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Enter a search term to find relevant passages from the Catechism
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Popular Topics</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Prayer</li>
                  <li>• Sacraments</li>
                  <li>• Ten Commandments</li>
                  <li>• Trinity</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">How to Search</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use specific terms</li>
                  <li>• Try different phrasings</li>
                  <li>• Search by topic or concept</li>
                  <li>• Use quotation marks for exact phrases</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}