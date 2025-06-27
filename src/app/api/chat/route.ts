import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Chat question received:', message)

    // Generate response using Catholic catechism assistant
    const response = await generateChatResponse(message)

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