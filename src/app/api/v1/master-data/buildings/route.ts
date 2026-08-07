import { NextResponse } from 'next/server';
import { AuthorizationError } from '../../../../../server/auth/authorization';
import { requireRequestContext } from '../../../../../server/api/auth-context';
import { parseListQuery, listMeta } from '../../../../../server/api/list-query';
import { errorResponse, successResponse } from '../../../../../server/api/response';
import { buildingSchema } from '../../../../../server/master-data/schemas';
import { createBuilding, listBuildings } from '../../../../../server/master-data/service';
import { validateCsrf } from '../../../../../server/auth/csrf';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRequestContext('property.read');
    const query = parseListQuery(new URL(request.url).searchParams);
    const result = await listBuildings(query);
    return NextResponse.json(successResponse(result.rows, listMeta(result.total, query.page, query.pageSize)));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(errorResponse('AUTH_FORBIDDEN', 'Forbidden'), { status: 403 });
    }

    if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
      return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 });
    }

    return NextResponse.json(errorResponse('MASTER_DATA_LIST_FAILED', 'Unable to fetch buildings'), { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const context = await requireRequestContext('property.manage');
    const body = await request.json().catch(() => null);
    const parsed = buildingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid building payload', parsed.error.flatten()), {
        status: 400,
      });
    }

    const created = await createBuilding(parsed.data, {
      actorUserId: context.user.id,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return NextResponse.json(successResponse(created), { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(errorResponse('AUTH_FORBIDDEN', 'Forbidden'), { status: 403 });
    }

    if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
      return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 });
    }

    return NextResponse.json(errorResponse('MASTER_DATA_CREATE_FAILED', 'Unable to create building'), { status: 500 });
  }
}
