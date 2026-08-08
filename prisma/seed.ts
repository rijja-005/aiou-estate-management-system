import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
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

  const buildingSeeds = [
    { code: 'ADMIN-BLK', name: 'Administration Block', notes: 'Main administrative offices and meeting rooms' },
    { code: 'ACADEMIC-BLK', name: 'Academic Block', notes: 'Classrooms, workshops, and auditoriums' },
    { code: 'COMMERCIAL-BLK', name: 'Commercial Centre', notes: 'University shops and service outlets' },
    { code: 'STAFF-COLONY', name: 'Staff Residential Colony', notes: 'Residential flats for university employees' },
  ];
  const buildings = new Map<string, { id: string }>();
  for (const seed of buildingSeeds) {
    const row = await prisma.building.upsert({ where: { code: seed.code }, update: { ...seed, isEnabled: true, deletedAt: null }, create: seed });
    buildings.set(seed.code, row);
  }

  const floorSeeds = [
    ['ADMIN-BLK', 'GF', 'Ground Floor', 0], ['ADMIN-BLK', 'F1', 'First Floor', 1],
    ['ACADEMIC-BLK', 'GF', 'Ground Floor', 0], ['ACADEMIC-BLK', 'F1', 'First Floor', 1],
    ['COMMERCIAL-BLK', 'GF', 'Ground Floor', 0],
    ['STAFF-COLONY', 'GF', 'Ground Floor', 0], ['STAFF-COLONY', 'F1', 'First Floor', 1],
  ] as const;
  const floors = new Map<string, { id: string }>();
  for (const [buildingCode, code, name, sortOrder] of floorSeeds) {
    const buildingId = buildings.get(buildingCode)!.id;
    const row = await prisma.floor.upsert({ where: { buildingId_code: { buildingId, code } }, update: { name, sortOrder, isEnabled: true, deletedAt: null }, create: { buildingId, code, name, sortOrder } });
    floors.set(`${buildingCode}:${code}`, row);
  }

  const departmentSeeds = [
    { code: 'ESTATE', name: 'Estate Department' }, { code: 'CS', name: 'Computer Science Department' },
    { code: 'FIN', name: 'Finance Department' }, { code: 'REG', name: 'Registrar Office' },
    { code: 'HR', name: 'Human Resources Department' },
  ];
  const departments = new Map<string, { id: string }>();
  for (const seed of departmentSeeds) {
    const row = await prisma.department.upsert({ where: { code: seed.code }, update: { ...seed, isEnabled: true, deletedAt: null }, create: seed });
    departments.set(seed.code, row);
  }

  const propertyTypeSeeds = [
    { code: 'CLASSROOM', name: 'Classroom', category: 'BOOKABLE' }, { code: 'WORKSHOP', name: 'Workshop', category: 'BOOKABLE' },
    { code: 'AUDITORIUM', name: 'Auditorium', category: 'BOOKABLE' }, { code: 'LAWN', name: 'Lawn', category: 'BOOKABLE' },
    { code: 'OFFICE', name: 'Office', category: 'OFFICE' }, { code: 'SHOP', name: 'Shop', category: 'COMMERCIAL' },
    { code: 'FLAT', name: 'Residential Flat', category: 'RESIDENTIAL' },
  ];
  const propertyTypes = new Map<string, { id: string }>();
  for (const seed of propertyTypeSeeds) {
    const row = await prisma.propertyType.upsert({ where: { code: seed.code }, update: { ...seed, isEnabled: true, deletedAt: null }, create: seed });
    propertyTypes.set(seed.code, row);
  }

  const roomTypeSeeds = [{ code: 'STANDARD', name: 'Standard Room' }, { code: 'MEETING', name: 'Meeting Room' }, { code: 'LAB', name: 'Computer Lab' }];
  const roomTypes = new Map<string, { id: string }>();
  for (const seed of roomTypeSeeds) {
    const row = await prisma.roomType.upsert({ where: { code: seed.code }, update: { ...seed, isEnabled: true, deletedAt: null }, create: seed });
    roomTypes.set(seed.code, row);
  }

  const facilitySeeds = [{ code: 'AC', name: 'Air Conditioning' }, { code: 'PROJECTOR', name: 'Multimedia Projector' }, { code: 'WIFI', name: 'Wi-Fi' }, { code: 'UPS', name: 'Backup Power' }];
  const facilities = new Map<string, { id: string }>();
  for (const seed of facilitySeeds) {
    const row = await prisma.facility.upsert({ where: { code: seed.code }, update: { ...seed, isEnabled: true, deletedAt: null }, create: seed });
    facilities.set(seed.code, row);
  }

  const propertySeeds = [
    { propertyCode: 'ADM-OFF-101', displayName: 'Registrar Office', building: 'ADMIN-BLK', floor: 'GF', type: 'OFFICE', room: 'STANDARD', capacity: 8, isPaid: false },
    { propertyCode: 'ADM-MR-201', displayName: 'Executive Meeting Room', building: 'ADMIN-BLK', floor: 'F1', type: 'OFFICE', room: 'MEETING', capacity: 18, isPaid: false },
    { propertyCode: 'ACD-CR-101', displayName: 'Classroom 101', building: 'ACADEMIC-BLK', floor: 'GF', type: 'CLASSROOM', room: 'STANDARD', capacity: 45, isPaid: false },
    { propertyCode: 'ACD-LAB-201', displayName: 'Computer Workshop Lab', building: 'ACADEMIC-BLK', floor: 'F1', type: 'WORKSHOP', room: 'LAB', capacity: 30, isPaid: false },
    { propertyCode: 'ACD-AUD-001', displayName: 'Main Auditorium', building: 'ACADEMIC-BLK', floor: 'GF', type: 'AUDITORIUM', room: 'STANDARD', capacity: 350, isPaid: true },
    { propertyCode: 'ACD-LAWN-01', displayName: 'Executive Club Lawn', building: 'ACADEMIC-BLK', floor: 'GF', type: 'LAWN', capacity: 500, isPaid: true },
    { propertyCode: 'SHOP-01', displayName: 'Stationery Shop', building: 'COMMERCIAL-BLK', floor: 'GF', type: 'SHOP', capacity: 8, isPaid: true },
    { propertyCode: 'SHOP-02', displayName: 'Book Store', building: 'COMMERCIAL-BLK', floor: 'GF', type: 'SHOP', capacity: 12, isPaid: true },
    { propertyCode: 'FLAT-B-01', displayName: 'Staff Flat B-01', building: 'STAFF-COLONY', floor: 'GF', type: 'FLAT', room: 'STANDARD', capacity: 6, isPaid: false },
    { propertyCode: 'FLAT-C-12', displayName: 'Staff Flat C-12', building: 'STAFF-COLONY', floor: 'F1', type: 'FLAT', room: 'STANDARD', capacity: 5, isPaid: false },
  ] as const;
  const properties = new Map<string, { id: string }>();
  for (const seed of propertySeeds) {
    const data = { displayName: seed.displayName, buildingId: buildings.get(seed.building)!.id, floorId: floors.get(`${seed.building}:${seed.floor}`)!.id, propertyTypeId: propertyTypes.get(seed.type)!.id, roomTypeId: 'room' in seed ? roomTypes.get(seed.room)!.id : null, capacity: seed.capacity, isPaid: seed.isPaid, operationalStatus: 'ACTIVE' as const, availabilityStatus: 'AVAILABLE' as const, occupancyStatus: 'VACANT' as const, description: `Demo record for ${seed.displayName}`, deletedAt: null };
    const row = await prisma.property.upsert({ where: { propertyCode: seed.propertyCode }, update: data, create: { propertyCode: seed.propertyCode, ...data } });
    properties.set(seed.propertyCode, row);
    for (const facilityCode of ['WIFI', 'UPS', ...(seed.type === 'CLASSROOM' || seed.type === 'AUDITORIUM' ? ['PROJECTOR', 'AC'] : [])]) {
      await prisma.propertyFacility.upsert({ where: { propertyId_facilityId: { propertyId: row.id, facilityId: facilities.get(facilityCode)!.id } }, update: {}, create: { propertyId: row.id, facilityId: facilities.get(facilityCode)!.id } });
    }
  }

  for (const [propertyCode, categoryCode, block] of [['FLAT-B-01', 'B', 'B'], ['FLAT-C-12', 'C', 'C']] as const) {
    const category = await prisma.flatCategory.findUniqueOrThrow({ where: { code: categoryCode } });
    await prisma.flatDetail.upsert({ where: { propertyId: properties.get(propertyCode)!.id }, update: { categoryId: category.id, block }, create: { propertyId: properties.get(propertyCode)!.id, categoryId: category.id, block } });
  }

  const employeeSeeds = [
    { employeeNumber: 'AIOU-1042', name: 'Ali Raza', grade: 18, designation: 'Deputy Director', department: 'ESTATE', phone: '03001234567', cnic: '6110112345671', retirementDate: new Date('2031-06-30') },
    { employeeNumber: 'AIOU-1187', name: 'Sana Ahmed', grade: 16, designation: 'Assistant Registrar', department: 'REG', phone: '03011234567', cnic: '6110112345672', retirementDate: new Date('2028-11-30') },
  ];
  for (const seed of employeeSeeds) {
    const grade = await prisma.employeeGrade.findUniqueOrThrow({ where: { rank: seed.grade } });
    await prisma.employee.upsert({ where: { employeeNumber: seed.employeeNumber }, update: { name: seed.name, gradeId: grade.id, designation: seed.designation, departmentId: departments.get(seed.department)!.id, phoneNormalized: seed.phone, cnicNormalized: seed.cnic, retirementDate: seed.retirementDate, isActive: true }, create: { employeeNumber: seed.employeeNumber, name: seed.name, gradeId: grade.id, designation: seed.designation, departmentId: departments.get(seed.department)!.id, phoneNormalized: seed.phone, cnicNormalized: seed.cnic, retirementDate: seed.retirementDate } });
  }

  await prisma.shopTenant.upsert({ where: { cnicNormalized: '6110112345699' }, update: { name: 'Muhammad Usman', phoneNormalized: '03005551234', email: 'usman@example.com', address: 'Islamabad', isActive: true }, create: { name: 'Muhammad Usman', cnicNormalized: '6110112345699', phoneNormalized: '03005551234', email: 'usman@example.com', address: 'Islamabad' } });

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

    const bookingStart = new Date(); bookingStart.setDate(bookingStart.getDate() + 2); bookingStart.setHours(10, 0, 0, 0);
    const bookingEnd = new Date(bookingStart); bookingEnd.setHours(13, 0, 0, 0);
    const booking = await prisma.booking.upsert({ where: { referenceNumber: 'BK-DEMO-001' }, update: { requesterName: 'Dr. Ayesha Khan', purpose: 'Faculty development workshop', startAt: bookingStart, endAt: bookingEnd, attendeeCount: 28, status: 'APPROVED', updatedBy: user.id }, create: { referenceNumber: 'BK-DEMO-001', requesterName: 'Dr. Ayesha Khan', purpose: 'Faculty development workshop', startAt: bookingStart, endAt: bookingEnd, attendeeCount: 28, status: 'APPROVED', submittedAt: new Date(), requestingDepartmentId: departments.get('CS')!.id, createdBy: user.id, updatedBy: user.id } });
    await prisma.bookingResource.upsert({ where: { bookingId_propertyId: { bookingId: booking.id, propertyId: properties.get('ACD-LAB-201')!.id } }, update: { startAt: bookingStart, endAt: bookingEnd, status: 'APPROVED' }, create: { bookingId: booking.id, propertyId: properties.get('ACD-LAB-201')!.id, startAt: bookingStart, endAt: bookingEnd, status: 'APPROVED' } });

    const allocation = await prisma.allocation.upsert({ where: { referenceNumber: 'OA-DEMO-001' }, update: { propertyId: properties.get('ADM-OFF-101')!.id, departmentId: departments.get('REG')!.id, responsiblePerson: 'Assistant Registrar', status: 'ACTIVE', updatedBy: user.id }, create: { referenceNumber: 'OA-DEMO-001', propertyId: properties.get('ADM-OFF-101')!.id, departmentId: departments.get('REG')!.id, responsiblePerson: 'Assistant Registrar', requestDate: new Date('2026-01-05'), startDate: new Date('2026-01-10'), status: 'ACTIVE', approvedBy: user.id, approvedAt: new Date('2026-01-08'), createdBy: user.id, updatedBy: user.id } });
    const existingHistory = await prisma.allocationHistory.findFirst({ where: { allocationId: allocation.id, toStatus: 'ACTIVE' } });
    if (!existingHistory) await prisma.allocationHistory.create({ data: { allocationId: allocation.id, toStatus: 'ACTIVE', departmentId: departments.get('REG')!.id, responsiblePerson: 'Assistant Registrar', effectiveAt: new Date('2026-01-10'), actorUserId: user.id } });

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
