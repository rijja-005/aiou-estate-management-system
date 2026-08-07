import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../../../server/api/response';
import { validateCsrf } from '../../../../../../server/auth/csrf';
import { bookingCancellationSchema, bookingDecisionSchema, bookingRejectionSchema } from '../../../../../../server/bookings/schemas';
import { cancelBooking, decideBooking, finalizeBooking, submitBooking } from '../../../../../../server/bookings/service';
type Context = { params: Promise<{ id: string; action: string }> };
export async function POST(request: Request, context: Context): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  const { id, action } = await context.params;
  try {
    if (action === 'submit') { const actor = await requireRequestContext('booking.create'); return NextResponse.json(successResponse(await submitBooking(id, { userId: actor.user.id, canApprove: actor.user.permissions.includes('booking.approve') }))); }
    if (action === 'complete' || action === 'expire') { const actor = await requireRequestContext('booking.approve'); return NextResponse.json(successResponse(await finalizeBooking(id, action === 'complete' ? 'COMPLETED' : 'EXPIRED', { userId: actor.user.id }))); }
    if (action === 'approve') { const actor = await requireRequestContext('booking.approve'); const parsed = bookingDecisionSchema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid decision'), { status: 400 }); return NextResponse.json(successResponse(await decideBooking(id, 'APPROVED', { userId: actor.user.id }, parsed.data.remarks))); }
    if (action === 'reject') { const actor = await requireRequestContext('booking.reject'); const parsed = bookingRejectionSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Rejection reason is required'), { status: 400 }); return NextResponse.json(successResponse(await decideBooking(id, 'REJECTED', { userId: actor.user.id }, parsed.data.reason))); }
    if (action === 'cancel') { const actor = await requireRequestContext('booking.create'); const parsed = bookingCancellationSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Cancellation reason is required'), { status: 400 }); return NextResponse.json(successResponse(await cancelBooking(id, { userId: actor.user.id, canApprove: actor.user.permissions.includes('booking.approve') }, parsed.data.reason))); }
    return NextResponse.json(errorResponse('NOT_FOUND', 'Action not found'), { status: 404 });
  } catch (error) { if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') return NextResponse.json(errorResponse('BOOKING_NOT_FOUND', 'Booking not found'), { status: 404 }); if (error instanceof Error && ['BOOKING_TIME_CONFLICT', 'BOOKING_INVALID_TRANSITION'].includes(error.message)) return NextResponse.json(errorResponse(error.message, 'Booking cannot transition because of its current state or a conflict'), { status: 409 }); if (error instanceof Error && error.message === 'BOOKING_FORBIDDEN') return NextResponse.json(errorResponse('AUTH_FORBIDDEN', 'Forbidden'), { status: 403 }); return NextResponse.json(errorResponse('BOOKING_ACTION_FAILED', 'Unable to process booking action'), { status: 500 }); }
}
