import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate model parameter
    const validModels = ["gpt-4", "gpt-3.5-turbo"]
    const selectedModel = validModels.includes(model) ? model : "gpt-3.5-turbo"

    console.log('Chat question received:', message, 'Model:', selectedModel)

    // Generate response using Catholic catechism assistant
    const response = await generateChatResponse(message, selectedModel)

    console.log('Chat response generated successfully')

    return NextResponse.json({
      response,
      message
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}