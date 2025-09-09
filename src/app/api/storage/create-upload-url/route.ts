import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    );

    const { userId, filename } = await request.json();

    // Validate required fields
    if (!userId || !filename) {
      return NextResponse.json(
        { error: 'userId and filename are required' },
        { status: 400 }
      );
    }

    const objectPath = `${userId}/${crypto.randomUUID()}-${filename}`;

    console.log('Creating signed upload URL for:', objectPath);

    const { data, error } = await supabase
      .storage
      .from('uploads')
      .createSignedUploadUrl(objectPath);

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Signed upload URL created successfully');

    return NextResponse.json({ 
      path: objectPath, 
      token: data.token,
      signedUrl: data.signedUrl 
    });
  } catch (error) {
    console.error('Create upload URL error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
