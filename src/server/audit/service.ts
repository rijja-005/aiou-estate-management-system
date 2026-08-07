import { prisma } from '../db/prisma';
import { Prisma } from '../../../node_modules/.prisma/client';

export type AuditInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: unknown;
  afterData?: unknown;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const beforeData = (input.beforeData ?? null) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  const afterData = (input.afterData ?? null) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      requestId: input.requestId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      beforeData,
      afterData,
    },
  });
}
