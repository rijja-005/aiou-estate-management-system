import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../../../server/api/response';
import { validateCsrf } from '../../../../../../server/auth/csrf';
import { extensionSchema, reasonSchema, transferSchema } from '../../../../../../server/flats/schemas';
import { extendRetirementOccupancy, transferFlatAllocation, transitionFlatAllocation } from '../../../../../../server/flats/service';

export async function POST(request: Request, context: RouteContext<'/api/v1/flat-allocations/[id]/[action]'>): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  const { id, action } = await context.params;
  try {
    const actor = await requireRequestContext(action === 'approve' || action === 'extend' ? 'flat.approve' : 'flat.manage');
    const body = await request.json().catch(() => ({}));
    if (action === 'transfer') {
      const parsed = transferSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Property and reason are required'), { status: 400 });
      return NextResponse.json(successResponse(await transferFlatAllocation(id, parsed.data.propertyId, parsed.data.reason, { userId: actor.user.id })));
    }
    if (action === 'extend') {
      const parsed = extensionSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid retirement extension'), { status: 400 });
      return NextResponse.json(successResponse(await extendRetirementOccupancy(id, parsed.data.revisedVacationDate, parsed.data.reason, parsed.data.approvingAuthority, { userId: actor.user.id })));
    }
    if (!['approve', 'possess', 'vacate', 'cancel'].includes(action)) return NextResponse.json(errorResponse('NOT_FOUND', 'Action not found'), { status: 404 });
    const parsed = ['vacate', 'cancel'].includes(action) ? reasonSchema.safeParse(body) : null;
    if (parsed && !parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Reason is required'), { status: 400 });
    return NextResponse.json(successResponse(await transitionFlatAllocation(id, action as 'approve' | 'possess' | 'vacate' | 'cancel', { userId: actor.user.id }, parsed?.success ? parsed.data.reason : undefined)));
  } catch (error) {
    if (error instanceof Error && ['FLAT_ALLOCATION_NOT_FOUND', 'FLAT_INVALID_TRANSITION', 'FLAT_ACTIVE_CONFLICT', 'FLAT_EMPLOYEE_INELIGIBLE', 'FLAT_DATA_NOT_FOUND', 'FLAT_EXTENSION_DATE_INVALID'].includes(error.message)) return NextResponse.json(errorResponse(error.message, 'Flat allocation action is not allowed'), { status: 409 });
    return NextResponse.json(errorResponse('FLAT_ALLOCATION_ACTION_FAILED', 'Unable to update flat allocation'), { status: 500 });
  }
}
