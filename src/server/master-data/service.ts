import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { writeAuditLog } from '../audit/service';
import type { ListQuery } from '../api/list-query';
import type {
  BuildingInput,
  DepartmentInput,
  FacilityInput,
  FloorInput,
  PropertyTypeInput,
  RoomTypeInput,
} from './schemas';

type AuditContext = {
  actorUserId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};

function bySearch(search: string | undefined, fields: string[]): Prisma.Sql | undefined {
  if (!search) return undefined;
  const value = `%${search}%`;
  return Prisma.sql`(${Prisma.join(fields.map((field) => Prisma.sql`${Prisma.raw(field)} ILIKE ${value}`), ' OR ')})`;
}

function validateSort(sort: string, allowed: ReadonlyArray<string>, fallback: string): string {
  return allowed.includes(sort) ? sort : fallback;
}

export async function listBuildings(query: ListQuery) {
  const where: Prisma.BuildingWhereInput = {
    deletedAt: null,
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.BuildingOrderByWithRelationInput = {
    [validateSort(query.sort, ['code', 'name', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
  };

  const [rows, total] = await prisma.$transaction([
    prisma.building.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.building.count({ where }),
  ]);

  return { rows, total };
}

export async function createBuilding(input: BuildingInput, audit: AuditContext) {
  const created = await prisma.building.create({
    data: {
      code: input.code,
      name: input.name,
      notes: input.notes,
      isEnabled: input.isEnabled,
    },
  });

  await writeAuditLog({
    actorUserId: audit.actorUserId,
    action: 'MASTER_DATA_CREATE',
    entityType: 'Building',
    entityId: created.id,
    requestId: audit.requestId,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
    afterData: created,
  });

  return created;
}

export async function listFloors(query: ListQuery, buildingId?: string) {
  const where: Prisma.FloorWhereInput = {
    deletedAt: null,
    ...(buildingId ? { buildingId } : {}),
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.FloorOrderByWithRelationInput = {
    [validateSort(query.sort, ['code', 'name', 'sortOrder', 'createdAt'], 'sortOrder')]: query.order,
  };

  const [rows, total] = await prisma.$transaction([
    prisma.floor.findMany({
      where,
      include: { building: true },
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.floor.count({ where }),
  ]);

  return { rows, total };
}

export async function createFloor(input: FloorInput, audit: AuditContext) {
  const created = await prisma.floor.create({
    data: {
      buildingId: input.buildingId,
      code: input.code,
      name: input.name,
      sortOrder: input.sortOrder,
      notes: input.notes,
      isEnabled: input.isEnabled,
    },
    include: { building: true },
  });

  await writeAuditLog({
    actorUserId: audit.actorUserId,
    action: 'MASTER_DATA_CREATE',
    entityType: 'Floor',
    entityId: created.id,
    requestId: audit.requestId,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
    afterData: created,
  });

  return created;
}

export function createDepartment(input: DepartmentInput, audit: AuditContext) {
  return prisma.department
    .create({
      data: {
        code: input.code,
        name: input.name,
        notes: input.notes,
        isEnabled: input.isEnabled,
      },
    })
    .then(async (created) => {
      await writeAuditLog({
        actorUserId: audit.actorUserId,
        action: 'MASTER_DATA_CREATE',
        entityType: 'Department',
        entityId: created.id,
        requestId: audit.requestId,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        afterData: created,
      });
      return created;
    });
}

export function createPropertyType(input: PropertyTypeInput, audit: AuditContext) {
  return prisma.propertyType
    .create({
      data: {
        code: input.code,
        name: input.name,
        category: input.category,
        notes: input.notes,
        isEnabled: input.isEnabled,
      },
    })
    .then(async (created) => {
      await writeAuditLog({
        actorUserId: audit.actorUserId,
        action: 'MASTER_DATA_CREATE',
        entityType: 'PropertyType',
        entityId: created.id,
        requestId: audit.requestId,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        afterData: created,
      });
      return created;
    });
}

export function createRoomType(input: RoomTypeInput, audit: AuditContext) {
  return prisma.roomType
    .create({
      data: {
        code: input.code,
        name: input.name,
        notes: input.notes,
        isEnabled: input.isEnabled,
      },
    })
    .then(async (created) => {
      await writeAuditLog({
        actorUserId: audit.actorUserId,
        action: 'MASTER_DATA_CREATE',
        entityType: 'RoomType',
        entityId: created.id,
        requestId: audit.requestId,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        afterData: created,
      });
      return created;
    });
}

export function createFacility(input: FacilityInput, audit: AuditContext) {
  return prisma.facility
    .create({
      data: {
        code: input.code,
        name: input.name,
        notes: input.notes,
        isEnabled: input.isEnabled,
      },
    })
    .then(async (created) => {
      await writeAuditLog({
        actorUserId: audit.actorUserId,
        action: 'MASTER_DATA_CREATE',
        entityType: 'Facility',
        entityId: created.id,
        requestId: audit.requestId,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        afterData: created,
      });
      return created;
    });
}

export async function listDepartments(query: ListQuery) {
  const where: Prisma.DepartmentWhereInput = {
    deletedAt: null,
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      orderBy: {
        [validateSort(query.sort, ['code', 'name', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.department.count({ where }),
  ]);

  return { rows, total };
}

export async function listPropertyTypes(query: ListQuery) {
  const where: Prisma.PropertyTypeWhereInput = {
    deletedAt: null,
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.propertyType.findMany({
      where,
      orderBy: {
        [validateSort(query.sort, ['code', 'name', 'category', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.propertyType.count({ where }),
  ]);

  return { rows, total };
}

export async function listRoomTypes(query: ListQuery) {
  const where: Prisma.RoomTypeWhereInput = {
    deletedAt: null,
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.roomType.findMany({
      where,
      orderBy: {
        [validateSort(query.sort, ['code', 'name', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.roomType.count({ where }),
  ]);

  return { rows, total };
}

export async function listFacilities(query: ListQuery) {
  const where: Prisma.FacilityWhereInput = {
    deletedAt: null,
    ...(query.isEnabled === undefined ? {} : { isEnabled: query.isEnabled }),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.facility.findMany({
      where,
      orderBy: {
        [validateSort(query.sort, ['code', 'name', 'createdAt', 'updatedAt'], 'createdAt')]: query.order,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.facility.count({ where }),
  ]);

  return { rows, total };
}
