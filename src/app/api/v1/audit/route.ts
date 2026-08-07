import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { prisma } from '../../../../server/db/prisma';

const allowedEntityTypes = new Set(['Building', 'Floor', 'Department', 'PropertyType', 'RoomType', 'Facility', 'Property']);

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRequestContext('property.read');
    const params = new URL(request.url).searchParams;
    const entityType = params.get('entityType');
    const entityId = params.get('entityId');
    if (!entityType || !allowedEntityTypes.has(entityType) || !entityId) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Valid entityType and entityId are required'), { status: 400 });
    const rows = await prisma.auditLog.findMany({ where: { entityType, entityId }, orderBy: { createdAt: 'desc' }, take: 50, include: { actor: { select: { id: true, displayName: true, email: true } } } });
    return NextResponse.json(successResponse(rows));
  } catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); }
}
