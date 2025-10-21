import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'
import { getAuthenticatedUser } from '@/lib/auth-utils'

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

    // Try to get authenticated user (optional for chat generation)
    let userId = 'anonymous'
    try {
      const user = await getAuthenticatedUser()
      if (user) {
        userId = (user as { id: string }).id
      }
    } catch (error) {
      // User is not authenticated, which is fine for chat
      console.log('Chat request from unauthenticated user')
    }

    console.log('Chat question received:', message, 'Model:', selectedModel, 'User:', userId)

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