'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FormatCCCContent } from '@/utils/formatCCCContent'

interface CCCModalProps {
  paragraphReference: string | null // Can be "1234" or "1234-1236"
  isOpen: boolean
  onClose: () => void
  onCCCClick?: (reference: string) => void // For nested paragraph links
}

interface CCCParagraph {
  paragraph_number: number
  content: string
}

interface CCCResponse {
  // Single paragraph response
  paragraph_number?: number
  content?: string
  // Range response
  start_paragraph?: number
  end_paragraph?: number
  paragraphs?: CCCParagraph[]
}

export default function CCCModal({ paragraphReference, isOpen, onClose, onCCCClick }: CCCModalProps) {
  const [data, setData] = useState<CCCResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && paragraphReference) {
      fetchParagraph(paragraphReference)
    }
  }, [isOpen, paragraphReference])

  const fetchParagraph = async (reference: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ccc/${reference}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch paragraph(s)')
      }
      
      const responseData = await response.json()
      setData(responseData)
    } catch (err) {
      console.error('Error fetching paragraph(s):', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setData(null)
    setError(null)
    onClose()
  }

  const isRange = data?.paragraphs !== undefined
  const displayTitle = isRange 
    ? `CCC ${data?.start_paragraph}-${data?.end_paragraph}`
    : `CCC ${data?.paragraph_number}`

  // Get current range for navigation
  const currentStart = isRange ? data?.start_paragraph! : data?.paragraph_number!
  const currentEnd = isRange ? data?.end_paragraph! : data?.paragraph_number!

  const canNavigatePrevious = currentStart > 1
  const canNavigateNext = currentEnd < 2865

  const handleNavigatePrevious = () => {
    if (!canNavigatePrevious) return
    
    const newEnd = currentStart - 1
    const newStart = Math.max(1, newEnd - (currentEnd - currentStart)) // Keep same range size
    
    if (newStart === newEnd) {
      fetchParagraph(newStart.toString())
    } else {
      fetchParagraph(`${newStart}-${newEnd}`)
    }
  }

  const handleNavigateNext = () => {
    if (!canNavigateNext) return
    
    const newStart = currentEnd + 1
    const newEnd = Math.min(2865, newStart + (currentEnd - currentStart)) // Keep same range size
    
    if (newStart === newEnd) {
      fetchParagraph(newStart.toString())
    } else {
      fetchParagraph(`${newStart}-${newEnd}`)
    }
  }

  // Keyboard navigation effect - placed after all variables are defined
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canNavigatePrevious && !isLoading) {
        e.preventDefault()
        handleNavigatePrevious()
      } else if (e.key === 'ArrowRight' && canNavigateNext && !isLoading) {
        e.preventDefault()
        handleNavigateNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, canNavigatePrevious, canNavigateNext, isLoading, handleNavigatePrevious, handleNavigateNext, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">
              Catechism of the Catholic Church
            </h2>
            
            {/* Navigation Buttons */}
            {data && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigatePrevious}
                  disabled={!canNavigatePrevious || isLoading}
                  className="h-8 w-8 p-0"
                  title="Previous paragraph(s)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateNext}
                  disabled={!canNavigateNext || isLoading}
                  className="h-8 w-8 p-0"
                  title="Next paragraph(s)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">Loading paragraph...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm font-medium">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {displayTitle}
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none space-y-6">
                {isRange ? (
                  // Display multiple paragraphs for ranges
                  data.paragraphs?.map((paragraph, index) => (
                    <div key={paragraph.paragraph_number} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {paragraph.paragraph_number}
                        </span>
                      </div>
                      <div className="text-foreground leading-relaxed">
                        <FormatCCCContent 
                          content={paragraph.content} 
                          onCCCClick={onCCCClick}
                        />
                      </div>
                      {index < (data.paragraphs?.length || 0) - 1 && (
                        <div className="border-t border-muted my-4" />
                      )}
                    </div>
                  ))
                ) : (
                  // Display single paragraph
                  <div className="text-foreground leading-relaxed">
                    <FormatCCCContent 
                      content={data.content || ''} 
                      onCCCClick={onCCCClick}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Catechism of the Catholic Church, Second Edition</span>
            <span className="hidden sm:inline">
              Use ← → keys to navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}