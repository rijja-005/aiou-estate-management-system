import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRequestContext } from '../../../../server/api/auth-context';
import { errorResponse, successResponse } from '../../../../server/api/response';
import { writeAuditLog } from '../../../../server/audit/service';
import { validateCsrf } from '../../../../server/auth/csrf';
import { prisma } from '../../../../server/db/prisma';
const schema = z.object({ propertyId: z.string().uuid().optional(), startAt: z.coerce.date(), endAt: z.coerce.date(), reason: z.string().trim().min(3).max(500) }).refine((x) => x.endAt > x.startAt, { path: ['endAt'], message: 'End must follow start' });
export async function GET(): Promise<NextResponse> { try { await requireRequestContext('booking.read'); return NextResponse.json(successResponse(await prisma.closureWindow.findMany({ where: { isActive: true }, include: { property: true }, orderBy: { startAt: 'asc' } }))); } catch { return NextResponse.json(errorResponse('AUTH_UNAUTHORIZED', 'Authentication required'), { status: 401 }); } }
export async function POST(request: Request): Promise<NextResponse> { if (!(await validateCsrf(request))) return NextResponse.json(errorResponse('CSRF_INVALID', 'Invalid CSRF token'), { status: 403 }); try { const actor = await requireRequestContext('property.manage'); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Invalid closure window', parsed.error.flatten()), { status: 400 }); const created = await prisma.closureWindow.create({ data: parsed.data }); await writeAuditLog({ actorUserId: actor.user.id, action: 'BOOKING_CLOSURE_CREATE', entityType: 'ClosureWindow', entityId: created.id, afterData: created }); return NextResponse.json(successResponse(created), { status: 201 }); } catch { return NextResponse.json(errorResponse('BOOKING_CLOSURE_CREATE_FAILED', 'Unable to create closure'), { status: 500 }); } }
