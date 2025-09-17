import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { query, context } = await request.json();

    // Validate required fields
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Both query and context are required' },
        { status: 400 }
      );
    }

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create the system prompt for the AI
    const systemPrompt = "You are a helpful and professional marketing analyst. Answer the user's question based only on the provided context. If the context does not contain the answer, say 'I could not find a specific answer in the provided document.' Do not use any outside knowledge. Be concise and answer in a clean, easy-to-read format.";

    // Prepare the messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nQuestion: ${query}`
      }
    ];

    // Make the OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        stream: true,
        temperature: 0.3, // Lower temperature for more focused answers
        max_tokens: 500,   // Limit response length for conciseness
      }),
    });

    // Check if the OpenAI API call was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' } }));
      console.error('OpenAI API error:', response.status, errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    // Return the streaming response directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in answer generation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}

