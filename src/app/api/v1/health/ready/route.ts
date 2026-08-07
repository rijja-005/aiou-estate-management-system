import { NextResponse } from 'next/server';
import { prisma } from '../../../../../server/db/prisma';

export async function GET(): Promise<NextResponse> {
  try { await prisma.$queryRaw`SELECT 1`; return NextResponse.json({ success: true, data: { status: 'ready', database: 'available', checkedAt: new Date().toISOString() } }, { headers: { 'cache-control': 'no-store' } }); }
  catch { return NextResponse.json({ success: false, data: { status: 'not-ready', database: 'unavailable' } }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}
