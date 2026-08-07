import { NextResponse } from 'next/server';
import { errorResponse, successResponse } from '../../../../../../server/api/response';
import { requireRequestContext } from '../../../../../../server/api/auth-context';
import { validateCsrf } from '../../../../../../server/auth/csrf';
import { archiveMasterRecord, getMasterRecord, isMasterDataResource, updateMasterRecord } from '../../../../../../server/master-data/lifecycle';
import { masterDataUpdateSchemas } from '../../../../../../server/master-data/schemas';

type Context = { params: Promise<{ resource: string; id: string }> };

export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  const { resource, id } = await context.params;
  if (!isMasterDataResource(resource)) return NextResponse.json(errorResponse('NOT_FOUND', 'Resource not found'), { status: 404 });
  try { await requireRequestContext('property.read'); const record = await getMasterRecord(resource, id); return record ? NextResponse.json(successResponse(record)) : NextResponse.json(errorResponse('MASTER_DATA_NOT_FOUND', 'Record not found'), { status: 404 }); }
  catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); }
}

export async function PATCH(request: Request, context: Context): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  const { resource, id } = await context.params;
  if (!isMasterDataResource(resource)) return NextResponse.json(errorResponse('NOT_FOUND', 'Resource not found'), { status: 404 });
  try {
    const actor = await requireRequestContext('property.manage');
    const parsed = masterDataUpdateSchemas[resource].safeParse(await request.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid update payload'), { status: 400 });
    return NextResponse.json(successResponse(await updateMasterRecord(resource, id, parsed.data, { actorUserId: actor.user.id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent })));
  } catch (error) {
    if (error instanceof Error && error.message === 'MASTER_DATA_NOT_FOUND') return NextResponse.json(errorResponse('MASTER_DATA_NOT_FOUND', 'Record not found'), { status: 404 });
    return NextResponse.json(errorResponse('MASTER_DATA_UPDATE_FAILED', 'Unable to update record'), { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  const { resource, id } = await context.params;
  if (!isMasterDataResource(resource)) return NextResponse.json(errorResponse('NOT_FOUND', 'Resource not found'), { status: 404 });
  try {
    const actor = await requireRequestContext('property.manage');
    await archiveMasterRecord(resource, id, { actorUserId: actor.user.id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent });
    return NextResponse.json(successResponse({ archived: true }));
  } catch (error) {
    if (error instanceof Error && error.message === 'MASTER_DATA_NOT_FOUND') return NextResponse.json(errorResponse('MASTER_DATA_NOT_FOUND', 'Record not found'), { status: 404 });
    if (error instanceof Error && error.message === 'MASTER_DATA_IN_USE') return NextResponse.json(errorResponse('MASTER_DATA_IN_USE', 'Record is referenced by an active property and cannot be archived'), { status: 409 });
    return NextResponse.json(errorResponse('MASTER_DATA_ARCHIVE_FAILED', 'Unable to archive record'), { status: 500 });
  }
}
