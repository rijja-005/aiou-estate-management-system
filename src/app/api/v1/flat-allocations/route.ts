import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { validateCsrf } from '../../../../server/auth/csrf';
import { flatAllocationSchema } from '../../../../server/flats/schemas';
import { createFlatAllocation, listFlatAllocations } from '../../../../server/flats/service';

export async function GET(): Promise<NextResponse> {
  try { await requireRequestContext('flat.read'); return NextResponse.json(successResponse(await listFlatAllocations())); }
  catch { return NextResponse.json(errorResponse('FLAT_ALLOCATION_LIST_FAILED', 'Unable to fetch flat allocations'), { status: 500 }); }
}
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const actor = await requireRequestContext('flat.manage');
    const parsed = flatAllocationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid flat allocation', parsed.error.flatten()), { status: 400 });
    return NextResponse.json(successResponse(await createFlatAllocation(parsed.data, { userId: actor.user.id })), { status: 201 });
  } catch (error) {
    if (error instanceof Error && ['FLAT_DATA_NOT_FOUND', 'FLAT_EMPLOYEE_INELIGIBLE', 'FLAT_ACTIVE_CONFLICT'].includes(error.message)) return NextResponse.json(errorResponse(error.message, 'Flat allocation conflicts with eligibility or availability'), { status: 409 });
    return NextResponse.json(errorResponse('FLAT_ALLOCATION_CREATE_FAILED', 'Unable to create flat allocation'), { status: 500 });
  }
}
