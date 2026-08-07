import { z } from 'zod';
export const employeeSchema=z.object({employeeNumber:z.string().trim().min(2).max(40),name:z.string().trim().min(2).max(150),gradeId:z.string().uuid(),designation:z.string().trim().min(2).max(150),departmentId:z.string().uuid(),phone:z.string().trim().min(10).max(20),cnic:z.string().trim().regex(/^\d{5}-?\d{7}-?\d$/),retirementDate:z.coerce.date()});
export const flatSetupSchema=z.object({propertyId:z.string().uuid(),categoryId:z.string().uuid(),block:z.string().trim().min(1).max(50)});
export const flatAllocationSchema=z.object({propertyId:z.string().uuid(),employeeId:z.string().uuid(),allocationDate:z.coerce.date().default(()=>new Date()),notes:z.string().trim().max(2000).optional(),submit:z.boolean().default(true)});
export const reasonSchema=z.object({reason:z.string().trim().min(3).max(1000)});
export const transferSchema=z.object({propertyId:z.string().uuid(),reason:z.string().trim().min(3).max(1000)});
export const extensionSchema=z.object({revisedVacationDate:z.coerce.date(),reason:z.string().trim().min(3).max(1000),approvingAuthority:z.string().trim().min(2).max(150)});
export type EmployeeInput=z.infer<typeof employeeSchema>;export type FlatAllocationInput=z.infer<typeof flatAllocationSchema>;
