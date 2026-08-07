import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma';
import { createBuilding, createFloor, createPropertyType } from '../master-data/service';
import { createProperty } from '../properties/service';
import { createBooking, decideBooking, submitBooking } from './service';
const run = process.env.RUN_DATABASE_TESTS === 'true';
describe.skipIf(!run)('booking lifecycle database integration', () => {
  it('approves one booking and rejects an overlapping request', async () => {
    const actor = await prisma.user.findUnique({ where: { email: process.env.SEED_SUPERADMIN_EMAIL ?? '' } }); if (!actor) throw new Error('Seeded Super Admin required');
    const suffix = Date.now().toString(36); const requestId = `phase6-test-${suffix}`; const audit = { actorUserId: actor.id, requestId }; const ids: string[] = [];
    try {
      const building = await createBuilding({ code: `B6-${suffix}`, name: 'Booking Test Building', isEnabled: true }, audit); ids.push(building.id);
      const floor = await createFloor({ buildingId: building.id, code: `F6-${suffix}`, name: 'Booking Test Floor', sortOrder: 1, isEnabled: true }, audit); ids.push(floor.id);
      const type = await createPropertyType({ code: `T6-${suffix}`, name: 'Classroom', category: 'CLASSROOM', isEnabled: true }, audit); ids.push(type.id);
      const property = await createProperty({ propertyCode: `R6-${suffix}`, displayName: 'Booking Test Room', buildingId: building.id, floorId: floor.id, propertyTypeId: type.id, capacity: 30, isPaid: false, operationalStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE', occupancyStatus: 'VACANT', facilityIds: [] }, audit); ids.push(property.id);
      const startAt = new Date(Date.now() + 7 * 86400000); const endAt = new Date(startAt.getTime() + 3 * 3600000);
      const common = { resourceIds: [property.id], requesterName: 'Test Requester', purpose: 'Integration test', startAt, endAt, attendeeCount: 10, isPaid: false, facilityIds: [], submit: false };
      const first = await createBooking(common, { userId: actor.id, requestId }); const second = await createBooking({ ...common, purpose: 'Overlapping test' }, { userId: actor.id, requestId }); ids.push(first.id, second.id);
      await submitBooking(first.id, { userId: actor.id, canApprove: true }); const approved = await decideBooking(first.id, 'APPROVED', { userId: actor.id }); expect(approved.status).toBe('APPROVED');
      await expect(submitBooking(second.id, { userId: actor.id, canApprove: true })).rejects.toThrow('BOOKING_TIME_CONFLICT');
    } finally {
      await prisma.notification.deleteMany({ where: { entityId: { in: ids } } }); await prisma.bookingApproval.deleteMany({ where: { bookingId: { in: ids } } }); await prisma.bookingResource.deleteMany({ where: { bookingId: { in: ids } } }); await prisma.booking.deleteMany({ where: { id: { in: ids } } }); await prisma.property.deleteMany({ where: { id: { in: ids } } }); await prisma.floor.deleteMany({ where: { id: { in: ids } } }); await prisma.building.deleteMany({ where: { id: { in: ids } } }); await prisma.propertyType.deleteMany({ where: { id: { in: ids } } }); await prisma.auditLog.deleteMany({ where: { requestId } });
    }
  });
});
