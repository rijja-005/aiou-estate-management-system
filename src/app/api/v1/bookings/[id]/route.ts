import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../../server/api/response';
import { getBooking } from '../../../../../server/bookings/service';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context): Promise<NextResponse> { try { await requireRequestContext('booking.read'); const row = await getBooking((await context.params).id); return row ? NextResponse.json(successResponse(row)) : NextResponse.json(errorResponse('BOOKING_NOT_FOUND', 'Booking not found'), { status: 404 }); } catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); } }
