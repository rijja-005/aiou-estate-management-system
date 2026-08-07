import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { validateCsrf } from '../../../../server/auth/csrf';
import { flatSetupSchema } from '../../../../server/flats/schemas';
import { listFlatMasters, setupFlat } from '../../../../server/flats/service';

export async function GET(): Promise<NextResponse> {
  try { await requireRequestContext('flat.read'); return NextResponse.json(successResponse(await listFlatMasters())); }
  catch { return NextResponse.json(errorResponse('FLAT_MASTER_LIST_FAILED', 'Unable to fetch flat master data'), { status: 500 }); }
}
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const actor = await requireRequestContext('flat.manage');
    const parsed = flatSetupSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid flat setup', parsed.error.flatten()), { status: 400 });
    return NextResponse.json(successResponse(await setupFlat(parsed.data.propertyId, parsed.data.categoryId, parsed.data.block, { userId: actor.user.id })), { status: 201 });
  } catch { return NextResponse.json(errorResponse('FLAT_SETUP_FAILED', 'Unable to configure flat'), { status: 500 }); }
}
