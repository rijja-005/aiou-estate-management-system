import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../node_modules/.prisma/client';
import { logger } from '../src/lib/logger';
import { hashPassword } from '../src/server/auth/password';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/aiou_estate',
});

const prisma = new PrismaClient({ adapter });

const permissions = [
  { code: 'system.read', module: 'system', action: 'read' },
  { code: 'system.manage', module: 'system', action: 'manage' },
  { code: 'booking.read', module: 'booking', action: 'read' },
  { code: 'booking.create', module: 'booking', action: 'create' },
  { code: 'booking.approve', module: 'booking', action: 'approve' },
  { code: 'booking.reject', module: 'booking', action: 'reject' },
  { code: 'property.read', module: 'property', action: 'read' },
  { code: 'property.manage', module: 'property', action: 'manage' },
  { code: 'allocation.read', module: 'allocation', action: 'read' },
  { code: 'allocation.create', module: 'allocation', action: 'create' },
  { code: 'allocation.approve', module: 'allocation', action: 'approve' },
  { code: 'allocation.manage', module: 'allocation', action: 'manage' },
  { code: 'shop.read', module: 'shop', action: 'read' },
  { code: 'shop.manage', module: 'shop', action: 'manage' },
  { code: 'finance.read', module: 'finance', action: 'read' },
  { code: 'finance.manage', module: 'finance', action: 'manage' },
  { code: 'payment.reverse', module: 'payment', action: 'reverse' },
  { code: 'flat.read', module: 'flat', action: 'read' },
  { code: 'flat.manage', module: 'flat', action: 'manage' },
  { code: 'flat.approve', module: 'flat', action: 'approve' },
  { code: 'report.read', module: 'report', action: 'read' },
  { code: 'report.manage', module: 'report', action: 'manage' },
  { code: 'search.read', module: 'search', action: 'read' },
] as const;

const roles = [
  { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full system access', isSystem: true },
  { code: 'ESTATE_ADMIN', name: 'Estate Admin', description: 'Estate management access', isSystem: true },
  { code: 'ESTATE_STAFF', name: 'Estate Staff', description: 'Operational estate access', isSystem: true },
  { code: 'ACCOUNT_OFFICER', name: 'Account Officer', description: 'Financial operations access', isSystem: true },
  { code: 'VIEWER', name: 'Viewer', description: 'Read-only access', isSystem: true },
] as const;

const rolePermissionCodes: Record<string, string[]> = {
  SUPER_ADMIN: permissions.map((permission) => permission.code),
  ESTATE_ADMIN: ['system.read', 'booking.read', 'booking.create', 'booking.approve', 'booking.reject', 'property.read', 'property.manage', 'allocation.read', 'allocation.create', 'allocation.approve', 'allocation.manage', 'shop.read', 'shop.manage', 'finance.read', 'flat.read', 'flat.manage', 'flat.approve', 'report.read', 'report.manage', 'search.read'],
  ESTATE_STAFF: ['system.read', 'booking.read', 'booking.create', 'property.read', 'allocation.read', 'allocation.create', 'flat.read', 'flat.manage', 'report.read', 'search.read'],
  ACCOUNT_OFFICER: ['system.read', 'property.read', 'shop.read', 'finance.read', 'finance.manage', 'payment.reverse'],
  VIEWER: ['system.read', 'booking.read', 'property.read', 'allocation.read', 'shop.read', 'flat.read', 'report.read', 'search.read'],
};

const flatCategories = [
  { code: 'B', name: 'Category B', minimumGradeRank: 17, maximumGradeRank: 22, expectedInventory: 40 },
  { code: 'C', name: 'Category C', minimumGradeRank: 12, maximumGradeRank: 16, expectedInventory: 32 },
  { code: 'D', name: 'Category D', minimumGradeRank: 2, maximumGradeRank: 11, expectedInventory: 80 },
] as const;

async function main(): Promise<void> {
  logger.info('Seed process started');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        isActive: true,
      },
      create: {
        code: permission.code,
        module: permission.module,
        action: permission.action,
        isActive: true,
      },
    });
  }

  for (const role of roles) {
    const persistedRole = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        isActive: true,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        isActive: true,
      },
    });

    const permissionRows = await prisma.permission.findMany({
      where: {
        code: {
          in: rolePermissionCodes[role.code],
        },
      },
      select: { id: true },
    });

    for (const permissionRow of permissionRows) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: persistedRole.id,
            permissionId: permissionRow.id,
          },
        },
        update: {},
        create: {
          roleId: persistedRole.id,
          permissionId: permissionRow.id,
        },
      });
    }
  }

  for (let rank = 2; rank <= 22; rank += 1) {
    await prisma.employeeGrade.upsert({ where: { code: `BPS-${rank}` }, update: { name: `BPS ${rank}`, rank, isEnabled: true }, create: { code: `BPS-${rank}`, name: `BPS ${rank}`, rank } });
  }
  for (const category of flatCategories) {
    await prisma.flatCategory.upsert({ where: { code: category.code }, update: { ...category, postRetirementMonths: 6, isEnabled: true }, create: { ...category, postRetirementMonths: 6 } });
  }

  const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  const superAdminName = process.env.SEED_SUPERADMIN_NAME ?? 'Super Admin';

  if (superAdminEmail && superAdminPassword) {
    const passwordHash = await hashPassword(superAdminPassword);

    const user = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        displayName: superAdminName,
        passwordHash,
        isActive: true,
        disabledAt: null,
      },
      create: {
        email: superAdminEmail,
        displayName: superAdminName,
        passwordHash,
        isActive: true,
      },
    });

    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
        assignedBy: user.id,
      },
    });

    logger.info({ email: superAdminEmail }, 'Seeded super admin account');
  } else {
    logger.warn('SEED_SUPERADMIN_EMAIL or SEED_SUPERADMIN_PASSWORD not set; skipping super admin user seed');
  }

  logger.info('Seed process completed');
}

main().catch((error: unknown) => {
  logger.error({ error }, 'Seed failed');
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
