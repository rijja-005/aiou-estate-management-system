import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma';
import { createBuilding, createFloor, createPropertyType } from '../master-data/service';
import { archiveMasterRecord } from '../master-data/lifecycle';
import { archiveProperty, createProperty, getProperty, updateProperty } from './service';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === 'true';

describe.skipIf(!runDatabaseTests)('property lifecycle database integration', () => {
  it('creates, updates, audits, and archives a property and its master data', async () => {
    const email = process.env.SEED_SUPERADMIN_EMAIL;
    const actor = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!actor) throw new Error('Seeded Super Admin is required');
    const suffix = Date.now().toString(36);
    const ids: string[] = [];
    try {
      const audit = { actorUserId: actor.id, requestId: `phase5-test-${suffix}` };
      const building = await createBuilding({ code: `T-${suffix}`, name: `Test Building ${suffix}`, isEnabled: true }, audit); ids.push(building.id);
      const floor = await createFloor({ buildingId: building.id, code: `F-${suffix}`, name: 'Test Floor', sortOrder: 1, isEnabled: true }, audit); ids.push(floor.id);
      const type = await createPropertyType({ code: `PT-${suffix}`, name: 'Test Property Type', category: 'TEST', isEnabled: true }, audit); ids.push(type.id);
      const property = await createProperty({ propertyCode: `P-${suffix}`, displayName: 'Test Property', buildingId: building.id, floorId: floor.id, propertyTypeId: type.id, capacity: 10, isPaid: false, operationalStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE', occupancyStatus: 'VACANT', facilityIds: [] }, audit); ids.push(property.id);
      const updated = await updateProperty(property.id, { displayName: 'Updated Test Property', capacity: 12 }, audit);
      expect(updated.capacity).toBe(12);
      await archiveProperty(property.id, audit);
      expect(await getProperty(property.id)).toBeNull();
      await archiveMasterRecord('floors', floor.id, audit);
      const auditCount = await prisma.auditLog.count({ where: { requestId: audit.requestId } });
      expect(auditCount).toBeGreaterThanOrEqual(6);
    } finally {
      await prisma.propertyFacility.deleteMany({ where: { propertyId: { in: ids } } });
      await prisma.property.deleteMany({ where: { id: { in: ids } } });
      await prisma.floor.deleteMany({ where: { id: { in: ids } } });
      await prisma.building.deleteMany({ where: { id: { in: ids } } });
      await prisma.propertyType.deleteMany({ where: { id: { in: ids } } });
      await prisma.auditLog.deleteMany({ where: { requestId: `phase5-test-${suffix}` } });
    }
  });
});
