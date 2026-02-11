import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { GEMINI_LIVE_MODEL } from '@/lib/gemini-live/constants';

export async function POST() {
  // In production, add authentication check here
  try {
    return NextResponse.json({
      apiKey: env.GEMINI_API_KEY,
      model: GEMINI_LIVE_MODEL,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 500 }
    );
  }
}
