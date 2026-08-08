import { randomBytes } from 'crypto';
import { Prisma, type BookingStatus } from '@prisma/client';
import type { ListQuery } from '../api/list-query';
import { writeAuditLog } from '../audit/service';
import { prisma } from '../db/prisma';
import type { BookingCreateInput } from './schemas';
import { getEnv } from '../../lib/env';

type Actor = { userId: string; canApprove?: boolean; requestId?: string; ipAddress?: string; userAgent?: string };
const include = { department: true, resources: { include: { property: { include: { building: true, floor: true, propertyType: true } } } }, approvals: { include: { actor: { select: { displayName: true } } }, orderBy: { createdAt: 'asc' as const } } };

function referenceNumber(): string { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); return `BK-${date}-${randomBytes(3).toString('hex').toUpperCase()}`; }

async function notifyApprovers(bookingId: string, reference: string): Promise<void> {
  const users = await prisma.user.findMany({ where: { isActive: true, disabledAt: null, roles: { some: { role: { isActive: true, permissions: { some: { permission: { code: 'booking.approve', isActive: true } } } } } } }, select: { id: true } });
  if (users.length) await prisma.notification.createMany({ data: users.map((user) => ({ userId: user.id, type: 'BOOKING_SUBMITTED', title: 'Booking awaiting approval', message: `${reference} requires review.`, entityType: 'Booking', entityId: bookingId })) });
}

async function assertAvailability(tx: Prisma.TransactionClient, resourceIds: string[], startAt: Date, endAt: Date, blockPending = getEnv().BOOKING_BLOCK_PENDING_OVERLAPS): Promise<void> {
  const properties = await tx.property.count({ where: { id: { in: resourceIds }, deletedAt: null, operationalStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE' } });
  if (properties !== resourceIds.length) throw new Error('BOOKING_RESOURCE_UNAVAILABLE');
  const closure = await tx.closureWindow.findFirst({ where: { isActive: true, OR: [{ propertyId: null }, { propertyId: { in: resourceIds } }], startAt: { lt: endAt }, endAt: { gt: startAt } } });
  if (closure) throw new Error('BOOKING_CLOSURE_CONFLICT');
  const statuses: BookingStatus[] = blockPending ? ['PENDING_APPROVAL', 'APPROVED'] : ['APPROVED'];
  const conflict = await tx.bookingResource.findFirst({ where: { propertyId: { in: resourceIds }, status: { in: statuses }, startAt: { lt: endAt }, endAt: { gt: startAt } } });
  if (conflict) throw new Error('BOOKING_TIME_CONFLICT');
}

export async function listBookings(query: ListQuery, filters: { status?: BookingStatus; from?: Date; to?: Date }) {
  const where: Prisma.BookingWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(filters.from || filters.to ? { startAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}), ...(query.search ? { OR: [{ referenceNumber: { contains: query.search, mode: 'insensitive' } }, { requesterName: { contains: query.search, mode: 'insensitive' } }, { purpose: { contains: query.search, mode: 'insensitive' } }] } : {}) };
  const [rows, total] = await prisma.$transaction([prisma.booking.findMany({ where, include, orderBy: { startAt: query.order }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }), prisma.booking.count({ where })]);
  return { rows, total };
}

export async function getBooking(id: string) { return prisma.booking.findUnique({ where: { id }, include }); }

export async function createBooking(input: BookingCreateInput, actor: Actor) {
  if (input.idempotencyKey) { const existing = await prisma.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include }); if (existing) return existing; }
  const status: BookingStatus = input.submit ? 'PENDING_APPROVAL' : 'DRAFT';
  const created = await prisma.$transaction(async (tx) => {
    if (input.submit) await assertAvailability(tx, input.resourceIds, input.startAt, input.endAt, getEnv().BOOKING_BLOCK_PENDING_OVERLAPS);
    const booking = await tx.booking.create({ data: { referenceNumber: referenceNumber(), requestingDepartmentId: input.requestingDepartmentId, requesterName: input.requesterName, requesterEmail: input.requesterEmail, requesterPhone: input.requesterPhone, purpose: input.purpose, startAt: input.startAt, endAt: input.endAt, attendeeCount: input.attendeeCount, isPaid: input.isPaid, chargeAmount: input.chargeAmount, notes: input.notes, status, idempotencyKey: input.idempotencyKey, createdBy: actor.userId, updatedBy: actor.userId, submittedAt: input.submit ? new Date() : null, resources: { create: input.resourceIds.map((propertyId) => ({ propertyId, startAt: input.startAt, endAt: input.endAt, status })) } } });
    if (input.submit) await tx.bookingApproval.create({ data: { bookingId: booking.id, actorUserId: actor.userId, decision: 'SUBMITTED' } });
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include });
  }, { isolationLevel: 'Serializable' });
  await writeAuditLog({ actorUserId: actor.userId, action: input.submit ? 'BOOKING_SUBMIT' : 'BOOKING_CREATE', entityType: 'Booking', entityId: created.id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent, afterData: created });
  if (input.submit) await notifyApprovers(created.id, created.referenceNumber);
  return created;
}

export async function decideBooking(id: string, decision: 'APPROVED' | 'REJECTED', actor: Actor, remarks?: string) {
  const before = await getBooking(id); if (!before) throw new Error('BOOKING_NOT_FOUND'); if (before.status !== 'PENDING_APPROVAL') throw new Error('BOOKING_INVALID_TRANSITION');
  if (decision === 'REJECTED' && !remarks) throw new Error('BOOKING_REASON_REQUIRED');
  const updated = await prisma.$transaction(async (tx) => {
    if (decision === 'APPROVED') await assertAvailability(tx, before.resources.map((r) => r.propertyId), before.startAt, before.endAt, false);
    await tx.booking.update({ where: { id }, data: { status: decision, rejectionReason: decision === 'REJECTED' ? remarks : null, updatedBy: actor.userId } });
    await tx.bookingResource.updateMany({ where: { bookingId: id }, data: { status: decision } });
    await tx.bookingApproval.create({ data: { bookingId: id, actorUserId: actor.userId, decision, remarks } });
    return tx.booking.findUniqueOrThrow({ where: { id }, include });
  }, { isolationLevel: 'Serializable' });
  await writeAuditLog({ actorUserId: actor.userId, action: `BOOKING_${decision}`, entityType: 'Booking', entityId: id, requestId: actor.requestId, ipAddress: actor.ipAddress, userAgent: actor.userAgent, beforeData: before, afterData: updated });
  await prisma.notification.create({ data: { userId: updated.createdBy, type: `BOOKING_${decision}`, title: `Booking ${decision.toLowerCase()}`, message: `${updated.referenceNumber} was ${decision.toLowerCase()}.`, entityType: 'Booking', entityId: id } });
  return updated;
}

export async function submitBooking(id: string, actor: Actor) {
  const before = await getBooking(id); if (!before) throw new Error('BOOKING_NOT_FOUND'); if (before.status !== 'DRAFT') throw new Error('BOOKING_INVALID_TRANSITION'); if (before.createdBy !== actor.userId && !actor.canApprove) throw new Error('BOOKING_FORBIDDEN');
  const updated = await prisma.$transaction(async (tx) => { await assertAvailability(tx, before.resources.map((resource) => resource.propertyId), before.startAt, before.endAt); await tx.booking.update({ where: { id }, data: { status: 'PENDING_APPROVAL', submittedAt: new Date(), updatedBy: actor.userId } }); await tx.bookingResource.updateMany({ where: { bookingId: id }, data: { status: 'PENDING_APPROVAL' } }); await tx.bookingApproval.create({ data: { bookingId: id, actorUserId: actor.userId, decision: 'SUBMITTED' } }); return tx.booking.findUniqueOrThrow({ where: { id }, include }); }, { isolationLevel: 'Serializable' });
  await writeAuditLog({ actorUserId: actor.userId, action: 'BOOKING_SUBMIT', entityType: 'Booking', entityId: id, beforeData: before, afterData: updated }); await notifyApprovers(id, updated.referenceNumber); return updated;
}

export async function cancelBooking(id: string, actor: Actor, reason: string) {
  const before = await getBooking(id); if (!before) throw new Error('BOOKING_NOT_FOUND'); if (!['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(before.status)) throw new Error('BOOKING_INVALID_TRANSITION');
  if (before.createdBy !== actor.userId && !actor.canApprove) throw new Error('BOOKING_FORBIDDEN');
  const updated = await prisma.$transaction(async (tx) => { await tx.booking.update({ where: { id }, data: { status: 'CANCELLED', cancellationReason: reason, updatedBy: actor.userId } }); await tx.bookingResource.updateMany({ where: { bookingId: id }, data: { status: 'CANCELLED' } }); await tx.bookingApproval.create({ data: { bookingId: id, actorUserId: actor.userId, decision: 'CANCELLED', remarks: reason } }); return tx.booking.findUniqueOrThrow({ where: { id }, include }); });
  await writeAuditLog({ actorUserId: actor.userId, action: 'BOOKING_CANCEL', entityType: 'Booking', entityId: id, beforeData: before, afterData: updated }); return updated;
}

export async function finalizeBooking(id: string, status: 'COMPLETED' | 'EXPIRED', actor: Actor) {
  const before = await getBooking(id); if (!before) throw new Error('BOOKING_NOT_FOUND');
  if (status === 'COMPLETED' && (before.status !== 'APPROVED' || before.endAt > new Date())) throw new Error('BOOKING_INVALID_TRANSITION');
  if (status === 'EXPIRED' && (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(before.status) || before.endAt > new Date())) throw new Error('BOOKING_INVALID_TRANSITION');
  const updated = await prisma.$transaction(async (tx) => { await tx.booking.update({ where: { id }, data: { status, completedAt: status === 'COMPLETED' ? new Date() : null, updatedBy: actor.userId } }); await tx.bookingResource.updateMany({ where: { bookingId: id }, data: { status } }); return tx.booking.findUniqueOrThrow({ where: { id }, include }); });
  await writeAuditLog({ actorUserId: actor.userId, action: `BOOKING_${status}`, entityType: 'Booking', entityId: id, beforeData: before, afterData: updated }); return updated;
}
