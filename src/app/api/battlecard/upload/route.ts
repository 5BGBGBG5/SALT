import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://inecta.app.n8n.cloud/webhook'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Forward to existing n8n webhook endpoint
    const response = await fetch(`${N8N_WEBHOOK_URL}/upload-battlecard`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`n8n webhook failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Battlecard uploaded successfully',
      ...result
    })
  } catch (error) {
    console.error('Battlecard upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload battlecard' },
      { status: 500 }
    )
  }
}
