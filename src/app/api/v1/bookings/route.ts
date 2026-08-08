import { NextResponse } from 'next/server';
import { listMeta, parseListQuery } from '../../../../server/api/list-query';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { validateCsrf } from '../../../../server/auth/csrf';
import { bookingCreateSchema } from '../../../../server/bookings/schemas';
import { createBooking, listBookings } from '../../../../server/bookings/service';
import type { BookingStatus } from '@prisma/client';

const statuses = new Set<BookingStatus>(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'EXPIRED']);
export async function GET(request: Request): Promise<NextResponse> {
  try { await requireRequestContext('booking.read'); const url = new URL(request.url); const query = parseListQuery(url.searchParams); const rawStatus = url.searchParams.get('status') as BookingStatus | null; const result = await listBookings(query, { status: rawStatus && statuses.has(rawStatus) ? rawStatus : undefined, from: url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined, to: url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined }); return NextResponse.json(successResponse(result.rows, listMeta(result.total, query.page, query.pageSize))); }
  catch { return NextResponse.json(errorResponse('BOOKING_LIST_FAILED', 'Unable to fetch bookings'), { status: 500 }); }
}
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try { const context = await requireRequestContext('booking.create'); const parsed = bookingCreateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid booking request', parsed.error.flatten()), { status: 400 }); const created = await createBooking(parsed.data, { userId: context.user.id, requestId: context.requestId, ipAddress: context.ipAddress, userAgent: context.userAgent }); return NextResponse.json(successResponse(created), { status: 201 }); }
  catch (error) { if (error instanceof Error && ['BOOKING_TIME_CONFLICT', 'BOOKING_CLOSURE_CONFLICT', 'BOOKING_RESOURCE_UNAVAILABLE'].includes(error.message)) return NextResponse.json(errorResponse(error.message, 'Requested resource is unavailable for this time'), { status: 409 }); return NextResponse.json(errorResponse('BOOKING_CREATE_FAILED', 'Unable to create booking'), { status: 500 }); }
}
