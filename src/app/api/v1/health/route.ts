import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  return NextResponse.json({ success: true, data: { status: 'ok' } });
}
