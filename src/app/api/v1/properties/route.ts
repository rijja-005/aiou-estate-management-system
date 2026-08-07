import { NextResponse } from 'next/server';
import { AuthorizationError } from '../../../../server/auth/authorization';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { parseListQuery, listMeta } from '../../../../server/api/list-query';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { propertyCreateSchema } from '../../../../server/properties/schemas';
import { createProperty, listProperties } from '../../../../server/properties/service';
import { validateCsrf } from '../../../../server/auth/csrf';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRequestContext('property.read');
    const url = new URL(request.url);
    const query = parseListQuery(url.searchParams);

    const result = await listProperties(query, {
      buildingId: url.searchParams.get('buildingId') ?? undefined,
      propertyTypeId: url.searchParams.get('propertyTypeId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    });

    return NextResponse.json(successResponse(result.rows, listMeta(result.total, query.page, query.pageSize)));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(errorResponse('AUTH_FORBIDDEN', 'Forbidden'), { status: 403 });
    }

    if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
      return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 });
    }

    return NextResponse.json(errorResponse('PROPERTY_LIST_FAILED', 'Unable to fetch properties'), { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 });
  try {
    const context = await requireRequestContext('property.manage');
    const body = await request.json().catch(() => null);
    const parsed = propertyCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid property payload', parsed.error.flatten()), {
        status: 400,
      });
    }

    const created = await createProperty(parsed.data, {
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

    return NextResponse.json(errorResponse('PROPERTY_CREATE_FAILED', 'Unable to create property'), { status: 500 });
  }
}
