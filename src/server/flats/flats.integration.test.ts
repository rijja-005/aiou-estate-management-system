import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma';
import { createBuilding, createFloor, createPropertyType } from '../master-data/service';
import { createProperty } from '../properties/service';
import { createEmployee, createFlatAllocation, extendRetirementOccupancy, setupFlat, transferFlatAllocation, transitionFlatAllocation } from './service';

const run = process.env.RUN_DATABASE_TESTS === 'true';
describe.skipIf(!run)('residential flat database lifecycle', () => {
  it('allocates, extends, transfers, and vacates while preserving history', async () => {
    const actor = await prisma.user.findUnique({ where: { email: process.env.SEED_SUPERADMIN_EMAIL ?? '' } });
    if (!actor) throw new Error('Seeded admin required');
    const grade = await prisma.employeeGrade.findUniqueOrThrow({ where: { code: 'BPS-17' } });
    const category = await prisma.flatCategory.findUniqueOrThrow({ where: { code: 'B' } });
    const suffix = Date.now().toString(36); const requestId = `phase9-test-${suffix}`; const audit = { actorUserId: actor.id, requestId }; const ids:string[]=[];
    try {
      const department = await prisma.department.create({ data:{ code:`S9D-${suffix}`,name:'Flat Test Department' } }); ids.push(department.id);
      const building = await createBuilding({ code:`S9B-${suffix}`,name:'Flat Test Building',isEnabled:true },audit);
      const floor = await createFloor({ buildingId:building.id,code:`S9F-${suffix}`,name:'Residential Floor',sortOrder:1,isEnabled:true },audit);
      const type = await createPropertyType({ code:`S9T-${suffix}`,name:'Residential Flat',category:'FLAT',isEnabled:true },audit);
      const properties=[];
      for (const number of [1,2]) properties.push(await createProperty({ propertyCode:`S9P${number}-${suffix}`,displayName:`Test Flat ${number}`,buildingId:building.id,floorId:floor.id,propertyTypeId:type.id,isPaid:false,operationalStatus:'ACTIVE',availabilityStatus:'AVAILABLE',occupancyStatus:'VACANT',facilityIds:[] },audit));
      ids.push(building.id,floor.id,type.id,...properties.map(x=>x.id));
      for (const property of properties) await setupFlat(property.id,category.id,'T',{ userId:actor.id });
      const employee = await createEmployee({ employeeNumber:`S9E-${suffix}`,name:'Phase Nine Employee',gradeId:grade.id,designation:'Test Officer',departmentId:department.id,phone:'03001234567',cnic:`35202${String(Date.now()).slice(-7)}1`,retirementDate:new Date(Date.UTC(2027,0,31)) },{ userId:actor.id }); ids.push(employee.id);
      const allocation = await createFlatAllocation({ propertyId:properties[0].id,employeeId:employee.id,allocationDate:new Date(),submit:true },{ userId:actor.id }); ids.push(allocation.id);
      await transitionFlatAllocation(allocation.id,'approve',{ userId:actor.id }); await transitionFlatAllocation(allocation.id,'possess',{ userId:actor.id });
      const original = (await prisma.flatAllocation.findUniqueOrThrow({ where:{id:allocation.id} })).expectedVacationDate;
      const revised = new Date(Date.UTC(2027,9,31)); await extendRetirementOccupancy(allocation.id,revised,'Vice Chancellor approval','Vice Chancellor',{ userId:actor.id });
      const extension = await prisma.retirementExtension.findFirstOrThrow({ where:{allocationId:allocation.id} });
      expect(extension.originalVacationDate.getTime()).toBe(original.getTime()); expect(extension.revisedVacationDate.getTime()).toBe(revised.getTime());
      const transferred = await transferFlatAllocation(allocation.id,properties[1].id,'Operational transfer',{ userId:actor.id }); ids.push(transferred.id);
      expect((await prisma.flatAllocation.findUniqueOrThrow({ where:{id:allocation.id} })).status).toBe('TRANSFERRED'); expect(transferred.expectedVacationDate.getTime()).toBe(revised.getTime());
      await transitionFlatAllocation(transferred.id,'vacate',{ userId:actor.id },'Retirement vacation');
      expect((await prisma.property.findUniqueOrThrow({ where:{id:properties[1].id} })).occupancyStatus).toBe('VACANT');
      expect(await prisma.flatAllocationHistory.count({ where:{allocationId:{in:[allocation.id,transferred.id]}} })).toBeGreaterThanOrEqual(6);
    } finally {
      await prisma.retirementExtension.deleteMany({ where:{allocationId:{in:ids}} }); await prisma.flatAllocationHistory.deleteMany({ where:{allocationId:{in:ids}} }); await prisma.flatAllocation.deleteMany({ where:{id:{in:ids}} }); await prisma.employee.deleteMany({ where:{id:{in:ids}} }); await prisma.flatDetail.deleteMany({ where:{propertyId:{in:ids}} }); await prisma.property.deleteMany({ where:{id:{in:ids}} }); await prisma.floor.deleteMany({ where:{id:{in:ids}} }); await prisma.building.deleteMany({ where:{id:{in:ids}} }); await prisma.propertyType.deleteMany({ where:{id:{in:ids}} }); await prisma.department.deleteMany({ where:{id:{in:ids}} }); await prisma.auditLog.deleteMany({ where:{OR:[{requestId},{entityId:{in:ids}}]} });
    }
  });
});
