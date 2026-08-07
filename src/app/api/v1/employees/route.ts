import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { validateCsrf } from '../../../../server/auth/csrf';
import { employeeSchema } from '../../../../server/flats/schemas';
import { createEmployee, listEmployees } from '../../../../server/flats/service';

export async function GET(): Promise<NextResponse> {
  try { await requireRequestContext('flat.read'); return NextResponse.json(successResponse(await listEmployees())); }
  catch { return NextResponse.json(errorResponse('EMPLOYEE_LIST_FAILED', 'Unable to fetch employees'), { status: 500 }); }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const actor = await requireRequestContext('flat.manage');
    const parsed = employeeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid employee', parsed.error.flatten()), { status: 400 });
    return NextResponse.json(successResponse(await createEmployee(parsed.data, { userId: actor.user.id })), { status: 201 });
  } catch { return NextResponse.json(errorResponse('EMPLOYEE_CREATE_FAILED', 'Unable to create employee'), { status: 500 }); }
}
