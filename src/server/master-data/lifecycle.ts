import { prisma } from '../db/prisma';
import { writeAuditLog } from '../audit/service';
import { masterDataUpdateSchemas, type MasterDataResource } from './schemas';

type AuditContext = { actorUserId: string; requestId?: string; ipAddress?: string; userAgent?: string };
const entityNames: Record<MasterDataResource, string> = { buildings: 'Building', floors: 'Floor', departments: 'Department', 'property-types': 'PropertyType', 'room-types': 'RoomType', facilities: 'Facility' };

export function isMasterDataResource(value: string): value is MasterDataResource {
  return value in masterDataUpdateSchemas;
}

export async function getMasterRecord(resource: MasterDataResource, id: string) {
  switch (resource) {
    case 'buildings': return prisma.building.findFirst({ where: { id, deletedAt: null } });
    case 'floors': return prisma.floor.findFirst({ where: { id, deletedAt: null }, include: { building: true } });
    case 'departments': return prisma.department.findFirst({ where: { id, deletedAt: null } });
    case 'property-types': return prisma.propertyType.findFirst({ where: { id, deletedAt: null } });
    case 'room-types': return prisma.roomType.findFirst({ where: { id, deletedAt: null } });
    case 'facilities': return prisma.facility.findFirst({ where: { id, deletedAt: null } });
  }
}

export async function updateMasterRecord(resource: MasterDataResource, id: string, input: unknown, audit: AuditContext) {
  const before = await getMasterRecord(resource, id);
  if (!before) throw new Error('MASTER_DATA_NOT_FOUND');
  let after: unknown;
  switch (resource) {
    case 'buildings': after = await prisma.building.update({ where: { id }, data: masterDataUpdateSchemas.buildings.parse(input) }); break;
    case 'floors': {
      const data = masterDataUpdateSchemas.floors.parse(input);
      after = await prisma.floor.update({ where: { id }, data }); break;
    }
    case 'departments': after = await prisma.department.update({ where: { id }, data: masterDataUpdateSchemas.departments.parse(input) }); break;
    case 'property-types': after = await prisma.propertyType.update({ where: { id }, data: masterDataUpdateSchemas['property-types'].parse(input) }); break;
    case 'room-types': after = await prisma.roomType.update({ where: { id }, data: masterDataUpdateSchemas['room-types'].parse(input) }); break;
    case 'facilities': after = await prisma.facility.update({ where: { id }, data: masterDataUpdateSchemas.facilities.parse(input) }); break;
  }
  await writeAuditLog({ actorUserId: audit.actorUserId, action: 'MASTER_DATA_UPDATE', entityType: entityNames[resource], entityId: id, requestId: audit.requestId, ipAddress: audit.ipAddress, userAgent: audit.userAgent, beforeData: before, afterData: after });
  return after;
}

async function assertNotInUse(resource: MasterDataResource, id: string): Promise<void> {
  let count = 0;
  switch (resource) {
    case 'buildings': count = await prisma.property.count({ where: { buildingId: id, deletedAt: null } }); break;
    case 'floors': count = await prisma.property.count({ where: { floorId: id, deletedAt: null } }); break;
    case 'property-types': count = await prisma.property.count({ where: { propertyTypeId: id, deletedAt: null } }); break;
    case 'room-types': count = await prisma.property.count({ where: { roomTypeId: id, deletedAt: null } }); break;
    case 'facilities': count = await prisma.propertyFacility.count({ where: { facilityId: id, property: { deletedAt: null } } }); break;
    case 'departments': break;
  }
  if (count > 0) throw new Error('MASTER_DATA_IN_USE');
}

export async function archiveMasterRecord(resource: MasterDataResource, id: string, audit: AuditContext): Promise<void> {
  const before = await getMasterRecord(resource, id);
  if (!before) throw new Error('MASTER_DATA_NOT_FOUND');
  await assertNotInUse(resource, id);
  const data = { deletedAt: new Date(), deletedBy: audit.actorUserId, isEnabled: false };
  let after: unknown;
  switch (resource) {
    case 'buildings': after = await prisma.building.update({ where: { id }, data }); break;
    case 'floors': after = await prisma.floor.update({ where: { id }, data }); break;
    case 'departments': after = await prisma.department.update({ where: { id }, data }); break;
    case 'property-types': after = await prisma.propertyType.update({ where: { id }, data }); break;
    case 'room-types': after = await prisma.roomType.update({ where: { id }, data }); break;
    case 'facilities': after = await prisma.facility.update({ where: { id }, data }); break;
  }
  await writeAuditLog({ actorUserId: audit.actorUserId, action: 'MASTER_DATA_ARCHIVE', entityType: entityNames[resource], entityId: id, requestId: audit.requestId, ipAddress: audit.ipAddress, userAgent: audit.userAgent, beforeData: before, afterData: after });
}
