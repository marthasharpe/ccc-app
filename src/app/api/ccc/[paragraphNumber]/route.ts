import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paragraphNumber: string }> }
) {
  try {
    const resolvedParams = await params;
    const paramValue = resolvedParams.paragraphNumber

    // Handle range format: "283-284" or single number: "283"
    let startNum: number, endNum: number

    if (paramValue.includes('-')) {
      const [start, end] = paramValue.split('-').map(n => parseInt(n.trim()))
      
      if (isNaN(start) || isNaN(end) || start < 1 || end > 2865 || start > end) {
        return NextResponse.json(
          { error: 'Invalid paragraph range. Numbers must be between 1 and 2865, with start ≤ end.' },
          { status: 400 }
        )
      }

      // Limit range size for performance (max 10 paragraphs)
      if (end - start > 9) {
        return NextResponse.json(
          { error: 'Range too large. Maximum 10 paragraphs allowed.' },
          { status: 400 }
        )
      }

      startNum = start
      endNum = end
    } else {
      const single = parseInt(paramValue)
      
      if (isNaN(single) || single < 1 || single > 2865) {
        return NextResponse.json(
          { error: 'Invalid paragraph number. Must be between 1 and 2865.' },
          { status: 400 }
        )
      }

      startNum = endNum = single
    }

    console.log('Fetching CCC paragraphs:', startNum === endNum ? startNum : `${startNum}-${endNum}`)

    // Fetch the paragraph(s) from Supabase
    const { data: paragraphs, error } = await supabaseService
      .from('ccc_paragraphs')
      .select('id, paragraph_number, content')
      .gte('paragraph_number', startNum)
      .lte('paragraph_number', endNum)
      .order('paragraph_number', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch paragraphs' },
        { status: 500 }
      )
    }

    if (!paragraphs || paragraphs.length === 0) {
      return NextResponse.json(
        { error: 'Paragraph(s) not found' },
        { status: 404 }
      )
    }

    // Return single paragraph or array for ranges
    if (startNum === endNum) {
      return NextResponse.json({
        paragraph_number: paragraphs[0].paragraph_number,
        content: paragraphs[0].content
      })
    } else {
      return NextResponse.json({
        start_paragraph: startNum,
        end_paragraph: endNum,
        paragraphs: paragraphs.map(p => ({
          paragraph_number: p.paragraph_number,
          content: p.content
        }))
      })
    }

  } catch (error) {
    console.error('CCC API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}