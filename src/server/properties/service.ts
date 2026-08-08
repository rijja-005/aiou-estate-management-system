import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { ListQuery } from '../api/list-query';
import { writeAuditLog } from '../audit/service';
import type { PropertyCreateInput, PropertyUpdateInput } from './schemas';

type AuditContext = {
  actorUserId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};

function validateSort(sort: string, allowed: ReadonlyArray<string>, fallback: string): string {
  return allowed.includes(sort) ? sort : fallback;
}

export async function listProperties(query: ListQuery, filters: { buildingId?: string; propertyTypeId?: string; status?: string }) {
  const where: Prisma.PropertyWhereInput = {
    deletedAt: null,
    ...(filters.buildingId ? { buildingId: filters.buildingId } : {}),
    ...(filters.propertyTypeId ? { propertyTypeId: filters.propertyTypeId } : {}),
    ...(filters.status ? { operationalStatus: filters.status as never } : {}),
    ...(query.search
      ? {
          OR: [
            { propertyCode: { contains: query.search, mode: 'insensitive' } },
            { displayName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      include: {
        building: true,
        floor: true,
        propertyType: true,
        roomType: true,
        facilities: {
          include: {
            facility: true,
          },
        },
      },
      orderBy: {
        [validateSort(query.sort, ['propertyCode', 'displayName', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return { rows, total };
}

export async function createProperty(input: PropertyCreateInput, audit: AuditContext) {
  const created = await prisma.$transaction(async (tx) => {
    const floor = await tx.floor.findFirst({ where: { id: input.floorId, buildingId: input.buildingId, deletedAt: null, isEnabled: true } });
    if (!floor) throw new Error('PROPERTY_FLOOR_BUILDING_MISMATCH');
    const property = await tx.property.create({
      data: {
        propertyCode: input.propertyCode,
        displayName: input.displayName,
        buildingId: input.buildingId,
        floorId: input.floorId,
        propertyTypeId: input.propertyTypeId,
        roomTypeId: input.roomTypeId,
        capacity: input.capacity,
        isPaid: input.isPaid,
        operationalStatus: input.operationalStatus,
        availabilityStatus: input.availabilityStatus,
        occupancyStatus: input.occupancyStatus,
        notes: input.notes,
        description: input.description,
        createdBy: audit.actorUserId,
        updatedBy: audit.actorUserId,
      },
    });

    if (input.facilityIds.length > 0) {
      await tx.propertyFacility.createMany({
        data: input.facilityIds.map((facilityId) => ({ propertyId: property.id, facilityId })),
        skipDuplicates: true,
      });
    }

    return tx.property.findUniqueOrThrow({
      where: { id: property.id },
      include: {
        building: true,
        floor: true,
        propertyType: true,
        roomType: true,
        facilities: { include: { facility: true } },
      },
    });
  });

  await writeAuditLog({
    actorUserId: audit.actorUserId,
    action: 'PROPERTY_CREATE',
    entityType: 'Property',
    entityId: created.id,
    requestId: audit.requestId,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
    afterData: created,
  });

  return created;
}

const propertyInclude = {
  building: true,
  floor: true,
  propertyType: true,
  roomType: true,
  facilities: { include: { facility: true } },
} satisfies Prisma.PropertyInclude;

export async function getProperty(id: string) {
  return prisma.property.findFirst({ where: { id, deletedAt: null }, include: propertyInclude });
}

export async function updateProperty(id: string, input: PropertyUpdateInput, audit: AuditContext) {
  const before = await getProperty(id);
  if (!before) throw new Error('PROPERTY_NOT_FOUND');
  const buildingId = input.buildingId ?? before.buildingId;
  const floorId = input.floorId ?? before.floorId;
  const floor = await prisma.floor.findFirst({ where: { id: floorId, buildingId, deletedAt: null, isEnabled: true } });
  if (!floor) throw new Error('PROPERTY_FLOOR_BUILDING_MISMATCH');

  const updated = await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: { id },
      data: {
        propertyCode: input.propertyCode,
        displayName: input.displayName,
        buildingId: input.buildingId,
        floorId: input.floorId,
        propertyTypeId: input.propertyTypeId,
        roomTypeId: input.roomTypeId,
        capacity: input.capacity,
        isPaid: input.isPaid,
        operationalStatus: input.operationalStatus,
        availabilityStatus: input.availabilityStatus,
        occupancyStatus: input.occupancyStatus,
        notes: input.notes,
        description: input.description,
        updatedBy: audit.actorUserId,
      },
    });
    if (input.facilityIds) {
      await tx.propertyFacility.deleteMany({ where: { propertyId: id } });
      if (input.facilityIds.length) await tx.propertyFacility.createMany({ data: input.facilityIds.map((facilityId) => ({ propertyId: id, facilityId })), skipDuplicates: true });
    }
    return tx.property.findUniqueOrThrow({ where: { id }, include: propertyInclude });
  });
  await writeAuditLog({ actorUserId: audit.actorUserId, action: 'PROPERTY_UPDATE', entityType: 'Property', entityId: id, requestId: audit.requestId, ipAddress: audit.ipAddress, userAgent: audit.userAgent, beforeData: before, afterData: updated });
  return updated;
}

export async function archiveProperty(id: string, audit: AuditContext): Promise<void> {
  const before = await getProperty(id);
  if (!before) throw new Error('PROPERTY_NOT_FOUND');
  const archived = await prisma.property.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: audit.actorUserId, operationalStatus: 'ARCHIVED', availabilityStatus: 'BLOCKED', updatedBy: audit.actorUserId } });
  await writeAuditLog({ actorUserId: audit.actorUserId, action: 'PROPERTY_ARCHIVE', entityType: 'Property', entityId: id, requestId: audit.requestId, ipAddress: audit.ipAddress, userAgent: audit.userAgent, beforeData: before, afterData: archived });
}
