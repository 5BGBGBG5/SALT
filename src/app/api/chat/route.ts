import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert assistant for Inecta Food ERP software, specializing in food industry operations including dairy processing, meat processing, and food distribution. Answer questions using ONLY the provided documentation context. Be specific, reference feature names, and provide step-by-step guidance when applicable. If the documentation doesn't contain relevant information, say "I don't have documentation on that specific topic. You might want to contact Inecta support or check their knowledge base."

Documentation context:
${context || 'No documentation context provided.'}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: Message) => ({
        role: m.role,
        content: m.content
      }))
    });

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    return NextResponse.json({ content: textContent });
  } catch (error) {
    console.error('Error getting chat response:', error);
    return NextResponse.json(
      { error: 'Failed to get chat response' },
      { status: 500 }
    );
  }
}

