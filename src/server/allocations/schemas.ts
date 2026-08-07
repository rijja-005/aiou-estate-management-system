import { z } from 'zod';
export const allocationCreateSchema = z.object({ propertyId: z.string().uuid(), departmentId: z.string().uuid(), responsiblePerson: z.string().trim().min(2).max(150).optional(), requestDate: z.coerce.date().default(() => new Date()), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), notes: z.string().trim().max(2000).optional(), submit: z.boolean().default(false) }).refine((x) => !x.endDate || !x.startDate || x.endDate >= x.startDate, { path: ['endDate'], message: 'End date must not precede start date' });
export const allocationReasonSchema = z.object({ reason: z.string().trim().min(3).max(1000) });
export const allocationReassignSchema = z.object({ departmentId: z.string().uuid(), responsiblePerson: z.string().trim().min(2).max(150).optional(), reason: z.string().trim().min(3).max(1000) });
export type AllocationCreateInput = z.infer<typeof allocationCreateSchema>;
