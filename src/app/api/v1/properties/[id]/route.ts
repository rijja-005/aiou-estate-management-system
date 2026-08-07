import { NextResponse } from 'next/server';
import { errorResponse, successResponse } from '../../../../../server/api/response';
import { requireRequestContext } from '../../../../../server/api/auth-context';
import { validateCsrf } from '../../../../../server/auth/csrf';
import { propertyUpdateSchema } from '../../../../../server/properties/schemas';
import { archiveProperty, getProperty, updateProperty } from '../../../../../server/properties/service';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  try {
    await requireRequestContext('property.read');
    const record = await getProperty((await context.params).id);
    return record ? NextResponse.json(successResponse(record)) : NextResponse.json(errorResponse('PROPERTY_NOT_FOUND', 'Property not found'), { status: 404 });
  } catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); }
}

export async function PATCH(request: Request, context: Context): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const actor = await requireRequestContext('property.manage');
    const parsed = propertyUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid property payload', parsed.error.flatten()), { status: 400 });
    return NextResponse.json(successResponse(await updateProperty((await context.params).id, parsed.data, { actorUserId: actor.user.id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent })));
  } catch (error) {
    if (error instanceof Error && error.message === 'PROPERTY_NOT_FOUND') return NextResponse.json(errorResponse('PROPERTY_NOT_FOUND', 'Property not found'), { status: 404 });
    if (error instanceof Error && error.message === 'PROPERTY_FLOOR_BUILDING_MISMATCH') return NextResponse.json(errorResponse('PROPERTY_FLOOR_BUILDING_MISMATCH', 'Floor does not belong to the selected building'), { status: 409 });
    return NextResponse.json(errorResponse('PROPERTY_UPDATE_FAILED', 'Unable to update property'), { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const actor = await requireRequestContext('property.manage');
    await archiveProperty((await context.params).id, { actorUserId: actor.user.id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent });
    return NextResponse.json(successResponse({ archived: true }));
  } catch (error) {
    if (error instanceof Error && error.message === 'PROPERTY_NOT_FOUND') return NextResponse.json(errorResponse('PROPERTY_NOT_FOUND', 'Property not found'), { status: 404 });
    return NextResponse.json(errorResponse('PROPERTY_ARCHIVE_FAILED', 'Unable to archive property'), { status: 500 });
  }
}
