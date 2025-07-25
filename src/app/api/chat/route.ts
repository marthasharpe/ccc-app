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
    const selectedModel = validModels.includes(model) ? model : "gpt-4"

    console.log('Chat question received:', message, 'Model:', selectedModel)

    // Generate response using Catholic catechism assistant
    const { response, tokensUsed } = await generateChatResponse(message, selectedModel)

    console.log('Chat response generated successfully, tokens used:', tokensUsed)

    return NextResponse.json({
      response,
      message,
      tokensUsed
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}