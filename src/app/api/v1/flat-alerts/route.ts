import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { retirementAlerts } from '../../../../server/flats/service';

export async function GET(request: Request): Promise<NextResponse> {
  try { await requireRequestContext('flat.read'); const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days') ?? 60))); return NextResponse.json(successResponse(await retirementAlerts(new Date(), days))); }
  catch { return NextResponse.json(errorResponse('FLAT_ALERTS_FAILED', 'Unable to fetch retirement alerts'), { status: 500 }); }
}
