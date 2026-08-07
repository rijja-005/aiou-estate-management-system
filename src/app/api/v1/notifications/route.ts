import { NextResponse } from 'next/server';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { validateCsrf } from '../../../../server/auth/csrf';
import { prisma } from '../../../../server/db/prisma';
export async function GET(): Promise<NextResponse> { try { const actor = await requireRequestContext('system.read'); const rows = await prisma.notification.findMany({ where: { userId: actor.user.id }, orderBy: { createdAt: 'desc' }, take: 30 }); return NextResponse.json(successResponse(rows)); } catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); } }
export async function PATCH(request: Request): Promise<NextResponse> { if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 }); try { const actor = await requireRequestContext('system.read'); await prisma.notification.updateMany({ where: { userId: actor.user.id, readAt: null }, data: { readAt: new Date() } }); return NextResponse.json(successResponse({ read: true })); } catch { return NextResponse.json(errorResponse('NOTIFICATION_UPDATE_FAILED', 'Unable to update notifications'), { status: 500 }); } }
